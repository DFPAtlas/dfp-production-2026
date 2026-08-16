import { EditorDocument, EditorBlockData, EditorSection, EditorRow, EditorColumn } from './editor-types';
import { MERGE_TAGS } from './editor-types';

export interface ValidationIssue {
  code: string;
  title: string;
  explanation: string;
  severity: 'error' | 'warning' | 'recommendation';
  affectedBlockId?: string;
  affectedSetting?: string;
  suggestedFix: string;
}

export interface ValidationResult {
  status: 'not_checked' | 'needs_attention' | 'ready' | 'valid';
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: ValidationIssue[];
  passed: ValidationIssue[];
  lastValidated: string | null;
  totalIssues: number;
}

interface ValidationInput {
  document: EditorDocument;
  templateName: string;
  subject: string;
  category: string;
  previewText: string;
  htmlContent: string;
  brandKitId: string | null;
  isLegacy: boolean;
}

const VALID_CATEGORIES = ['general', 'welcome', 'invoice', 'project', 'lead', 'notification', 'marketing', 'transactional', 'account', 'password', 'appointment', 'support'];

const MARKETING_CATEGORIES = ['marketing', 'general', 'project'];

const MAX_SPACER_HEIGHT = 200;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_SUBJECT_LENGTH = 200;
const MAX_NAME_LENGTH = 100;
const MAX_PREVIEW_TEXT_LENGTH = 150;

function walkBlocks(document: EditorDocument): { block: EditorBlockData; section: EditorSection; row: EditorRow; column: EditorColumn }[] {
  const result: { block: EditorBlockData; section: EditorSection; row: EditorRow; column: EditorColumn }[] = [];
  for (const section of document.sections) {
    for (const row of section.rows) {
      for (const col of row.columns) {
        for (const block of col.blocks) {
          result.push({ block, section, row, column: col });
        }
      }
    }
  }
  return result;
}

function extractLinks(document: EditorDocument): string[] {
  const links: string[] = [];
  for (const { block } of walkBlocks(document)) {
    const data = block.data as Record<string, unknown>;
    if (data.url && typeof data.url === 'string' && data.url.trim() && data.url !== '#') links.push(data.url);
    if (data.link && typeof data.link === 'string' && data.link.trim()) links.push(data.link);
  }
  return links;
}

export function runValidation(input: ValidationInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const recommendations: ValidationIssue[] = [];
  const passed: ValidationIssue[] = [];
  const blocks = walkBlocks(input.document);

  // --- Metadata ---
  if (!input.templateName || !input.templateName.trim()) {
    errors.push({ code: 'META_001', title: 'Template name required', explanation: 'Every template needs a name so it can be found in the library.', severity: 'error', suggestedFix: 'Enter a template name in the email settings panel.' });
  } else if (input.templateName.trim().length > MAX_NAME_LENGTH) {
    warnings.push({ code: 'META_002', title: 'Template name too long', explanation: `The name should be under ${MAX_NAME_LENGTH} characters for readability.`, severity: 'warning', suggestedFix: 'Shorten the template name.' });
  } else {
    passed.push({ code: 'META_001', title: 'Template name valid', explanation: 'Template has a name.', severity: 'warning', suggestedFix: '' });
  }

  if (!input.subject || !input.subject.trim()) {
    warnings.push({ code: 'META_003', title: 'Subject line missing', explanation: 'Emails without a subject line may appear incomplete or be flagged as spam.', severity: 'warning', suggestedFix: 'Add a subject line in the email settings panel.' });
  } else {
    if (input.subject.length > MAX_SUBJECT_LENGTH) {
      warnings.push({ code: 'META_004', title: 'Subject line too long', explanation: `Subject lines over ${MAX_SUBJECT_LENGTH} characters may be truncated by email clients.`, severity: 'warning', suggestedFix: 'Shorten the subject to be more concise.' });
    }
    passed.push({ code: 'META_003', title: 'Subject line present', explanation: 'Email has a subject line.', severity: 'warning', suggestedFix: '' });
  }

  if (!input.category || !input.category.trim()) {
    warnings.push({ code: 'META_005', title: 'Category missing', explanation: 'A category helps organise templates and may affect validation rules.', severity: 'warning', suggestedFix: 'Select a category in the email settings panel.' });
  } else if (!VALID_CATEGORIES.includes(input.category)) {
    recommendations.push({ code: 'META_006', title: 'Unknown category', explanation: `"${input.category}" is not a recognised category.`, severity: 'recommendation', suggestedFix: 'Consider using a standard category like general, marketing, or transactional.' });
  }

  if (input.previewText && input.previewText.length > MAX_PREVIEW_TEXT_LENGTH) {
    warnings.push({ code: 'META_007', title: 'Preview text too long', explanation: `Preview text over ${MAX_PREVIEW_TEXT_LENGTH} characters will be truncated by email clients.`, severity: 'warning', suggestedFix: 'Shorten the preview text.' });
  }

  // --- Content ---
  const hasVisibleContent = blocks.some(({ block }) => {
    if (block.type === 'spacer' || block.type === 'divider' || block.type === 'preheader') return false;
    const data = block.data as Record<string, unknown>;
    return data.text || data.src || data.title || data.company || block.type === 'image' || block.type === 'button';
  });

  if (!hasVisibleContent) {
    errors.push({ code: 'CTN_001', title: 'Email is empty', explanation: 'The email body contains no visible content blocks.', severity: 'error', suggestedFix: 'Add content blocks like headings, text or images from the left panel.' });
  } else {
    passed.push({ code: 'CTN_001', title: 'Email has content', explanation: 'The email contains visible content.', severity: 'warning', suggestedFix: '' });
  }

  for (const { block } of blocks) {
    const data = block.data as Record<string, unknown>;

    if (block.type === 'button') {
      if (!data.text || !(data.text as string).trim()) {
        errors.push({ code: 'CTN_002', title: 'Empty button label', explanation: 'Buttons without text are confusing for recipients.', severity: 'error', affectedBlockId: block.id, suggestedFix: 'Add a label to this button in the Content tab.' });
      }
      const url = data.url as string || '';
      if (!url || url === '#') {
        warnings.push({ code: 'CTN_003', title: 'Button missing destination', explanation: 'This button has no valid URL. Recipients will not be able to click it.', severity: 'warning', affectedBlockId: block.id, suggestedFix: 'Set a valid URL for this button.' });
      }
    }

    if (block.type === 'image') {
      const alt = data.alt as string || '';
      if (!alt.trim()) {
        warnings.push({ code: 'CTN_004', title: 'Image missing alt text', explanation: 'Alt text helps screen readers and is shown when images are disabled.', severity: 'warning', affectedBlockId: block.id, suggestedFix: 'Add descriptive alt text for this image.' });
      }
    }

    if (block.type === 'spacer') {
      const h = parseInt((block.style.height as string) || '24', 10);
      if (h > MAX_SPACER_HEIGHT) {
        warnings.push({ code: 'CTN_005', title: 'Excessive spacer height', explanation: `Spacer is ${h}px which may create awkward gaps in some email clients.`, severity: 'warning', affectedBlockId: block.id, suggestedFix: `Reduce spacer height to ${MAX_SPACER_HEIGHT}px or less.` });
      }
    }

    if ((block.type === 'heading' || block.type === 'text') && data.text) {
      const tagPattern = /\{\{(\s*\w+\s*)\}\}/g;
      let match: RegExpExecArray | null;
      while ((match = tagPattern.exec(data.text as string)) !== null) {
        const tagName = match[1].trim();
        const found = MERGE_TAGS.find((t) => t.tag === tagName);
        if (!found) {
          warnings.push({ code: 'TAG_003', title: `Unknown merge tag: ${tagName}`, explanation: 'This tag is not in the recognised list and may not be replaced when sent.', severity: 'warning', affectedBlockId: block.id, suggestedFix: `Check if {{${tagName}}} is the correct tag name.` });
        } else if (!found.supported) {
          recommendations.push({ code: 'TAG_004', title: `Unsupported merge tag: ${tagName}`, explanation: 'This tag is defined but not yet supported by the send system.', severity: 'recommendation', affectedBlockId: block.id, suggestedFix: 'This tag may not be replaced. Verify with your send provider.' });
        }
      }
    }
  }

  // --- Links ---
  const links = extractLinks(input.document);
  for (const link of links) {
    if (link.startsWith('javascript:') || link.startsWith('data:') || link.startsWith('vbscript:')) {
      errors.push({ code: 'LNK_001', title: 'Unsafe link detected', explanation: `"${link.slice(0, 40)}..." is not a safe URL scheme.`, severity: 'error', suggestedFix: 'Replace with a valid HTTPS, mailto or tel URL.' });
    }
    if (!link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('tel:') && !link.startsWith('{{') && link !== '#') {
      warnings.push({ code: 'LNK_002', title: 'Non-standard link', explanation: `"${link.slice(0, 40)}" is not a recognised URL format. Use https://, mailto: or tel:.`, severity: 'warning', suggestedFix: 'Ensure the link starts with https://, mailto: or tel:.' });
    }
  }

  // --- Legal ---
  const hasUnsubscribe = blocks.some(({ block }) => block.type === 'unsubscribe');
  const isMarketing = MARKETING_CATEGORIES.includes(input.category);

  if (isMarketing && !hasUnsubscribe) {
    errors.push({ code: 'LGL_001', title: 'Marketing email missing unsubscribe', explanation: 'Marketing emails must include an unsubscribe link to comply with anti-spam regulations.', severity: 'error', suggestedFix: 'Add an Unsubscribe block from the Email category in the left panel.' });
  }

  const hasFooter = blocks.some(({ block }) => block.type === 'footer');
  if (!hasFooter) {
    recommendations.push({ code: 'LGL_002', title: 'Footer missing', explanation: 'Most professional emails include a footer with company details.', severity: 'recommendation', suggestedFix: 'Add a Footer block from the Email category for company details and legal information.' });
  }

  // --- Rendering ---
  if (!input.htmlContent || input.htmlContent.trim().length < 50) {
    warnings.push({ code: 'RND_001', title: 'Generated HTML appears empty', explanation: 'The rendered HTML output is unusually short.', severity: 'warning', suggestedFix: 'Ensure content blocks are properly configured and re-save.' });
  } else {
    passed.push({ code: 'RND_001', title: 'HTML rendered', explanation: 'Email HTML has been generated successfully.', severity: 'warning', suggestedFix: '' });
  }

  const emailWidth = input.document.settings.width;
  if (emailWidth < 320 || emailWidth > 800) {
    warnings.push({ code: 'RND_002', title: 'Unusual email width', explanation: `Email width is set to ${emailWidth}px. Most emails use 580-640px.`, severity: 'warning', suggestedFix: 'Set email width between 580 and 640px in the Settings tab.' });
  }

  // --- Merge tags in subject ---
  const subjectTagPattern = /\{\{(\s*\w+\s*)\}\}/g;
  let subjectMatch: RegExpExecArray | null;
  while ((subjectMatch = subjectTagPattern.exec(input.subject)) !== null) {
    const tagName = subjectMatch[1].trim();
    const found = MERGE_TAGS.find((t) => t.tag === tagName);
    if (!found) {
      warnings.push({ code: 'TAG_001', title: `Unknown merge tag in subject: ${tagName}`, explanation: 'This tag may not be replaced when sent.', severity: 'warning', suggestedFix: `Verify {{${tagName}}} is a supported merge tag.` });
    } else if (!found.supported) {
      recommendations.push({ code: 'TAG_002', title: `Unsupported merge tag in subject: ${tagName}`, explanation: 'This tag is not yet supported by the send system.', severity: 'recommendation', suggestedFix: 'This may not be replaced. Verify with your send provider.' });
    }
  }

  // --- Determine status ---
  const totalIssues = errors.length + warnings.length + recommendations.length;
  let status: ValidationResult['status'] = 'valid';
  if (errors.length > 0) status = 'needs_attention';
  else if (warnings.length > 3) status = 'ready';

  return {
    status,
    errors,
    warnings,
    recommendations,
    passed,
    lastValidated: new Date().toISOString(),
    totalIssues,
  };
}