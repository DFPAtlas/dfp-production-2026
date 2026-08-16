'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EditorToolbar from './EditorToolbar';
import LeftPanel from './LeftPanel';
import CenterCanvas from './CenterCanvas';
import RightPanel from './RightPanel';
import PreviewModal from './PreviewModal';
import EnhancedSendTestModal from './EnhancedSendTestModal';
import ValidationPanel from './ValidationPanel';
import ReviewPanel from './ReviewPanel';
import VersionHistoryPanel from './VersionHistoryPanel';
import VersionCompareModal from './VersionCompareModal';
import AIDrawer from './AIDrawer';
import { EditorDocument, EditorBlockData, EmailTemplate } from './editor-types';
import { createDefaultDocument, createBlock, createSection, renderDocumentToHtml, generateId } from './editor-utils';
import { useUndoRedo } from './useUndoRedo';
import { useAutosave } from './useAutosave';
import { ValidationResult, runValidation } from './email-validator';
import { BrandKit } from './brand-types';
import { Palette } from 'lucide-react';
import Link from 'next/link';

interface TemplateEditorProps {
  template: EmailTemplate;
  onSaveAndExit?: () => void;
}

export default function TemplateEditor({ template, onSaveAndExit }: TemplateEditorProps) {
  const router = useRouter();
  const [document, setDocument] = useState<EditorDocument>(() => {
    if (template.editor_document) return template.editor_document;
    return createDefaultDocument();
  });
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [category, setCategory] = useState(template.category);
  const [previewText, setPreviewText] = useState(template.preview_text || '');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [inlineEditing, setInlineEditing] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSendTest, setShowSendTest] = useState(false);
  const [compatibilityBanner, setCompatibilityBanner] = useState(template.is_legacy);
  const [unsavedWarning, setUnsavedWarning] = useState(false);
  const lastSavedRef = useRef(false);

  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationOutdated, setValidationOutdated] = useState(true);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{ a: { id: string }; b: { id: string } } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(template.brand_kit_id || null);
  const [brandApplyMode, setBrandApplyMode] = useState<'newOnly' | 'preserve' | 'replace'>('preserve');
  const [showBrandApply, setShowBrandApply] = useState(false);

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const docRef = useRef(document);
  docRef.current = document;

  const { pushState, undo, redo, canUndo, canRedo, clear } = useUndoRedo(50);

  const { status: saveStatus, errorMessage, save, flush, setRevision } = useAutosave({
    templateId: template.id,
    debounceMs: 2000,
    onConflict: () => setUnsavedWarning(true),
  });

  useEffect(() => {
    setRevision(template.revision || 1);
  }, [template.revision, setRevision]);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('email_brand_kits').select('*').in('status', ['active', 'draft']).order('name');
      if (data) setBrandKits(data as BrandKit[]);
    };
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchBrands();
    fetchUser();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setSelectedBlockId(null);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = undo();
        if (prev) setDocument(prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const next = redo();
        if (next) setDocument(next);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        const next = redo();
        if (next) setDocument(next);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockId) {
          e.preventDefault();
          handleDeleteBlock(selectedBlockId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedBlockId(null);
        setShowPreviewModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, undo, redo]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const updateDocument = useCallback((updater: (doc: EditorDocument) => EditorDocument) => {
    setDocument((prev) => {
      const next = updater(JSON.parse(JSON.stringify(prev)));
      pushState(next);
      return next;
    });
  }, [pushState]);

  const handleSave = useCallback(async () => {
    await flush();
    const html = renderDocumentToHtml(docRef.current);
    await save({
      name: name.trim(),
      subject: subject.trim(),
      html_content: html,
      category,
      preview_text: previewText,
      editor_document: docRef.current,
      is_legacy: false,
      status: template.status || 'draft',
    }, true);
    lastSavedRef.current = true;
  }, [flush, save, name, subject, category, previewText, template.status]);

  useEffect(() => {
    if (saveStatus === 'saved' && !lastSavedRef.current) return;
    lastSavedRef.current = false;
  }, [saveStatus]);

  useEffect(() => {
    if (saveStatus === 'saved') return;
    const html = renderDocumentToHtml(docRef.current);
    save({
      name: name.trim(),
      subject: subject.trim(),
      html_content: html,
      category,
      preview_text: previewText,
      editor_document: docRef.current,
      is_legacy: false,
      status: template.status || 'draft',
    });
  }, [document]);

  const handleUpdateBlock = useCallback((blockId: string, updates: { data?: Record<string, unknown>; style?: Record<string, unknown>; settings?: Record<string, unknown> }) => {
    updateDocument((doc) => {
      for (const section of doc.sections) {
        for (const row of section.rows) {
          for (const col of row.columns) {
            for (let i = 0; i < col.blocks.length; i++) {
              if (col.blocks[i].id === blockId) {
                if (updates.data) col.blocks[i] = { ...col.blocks[i], data: { ...col.blocks[i].data, ...updates.data } };
                if (updates.style) col.blocks[i] = { ...col.blocks[i], style: { ...col.blocks[i].style, ...updates.style } };
                if (updates.settings) col.blocks[i] = { ...col.blocks[i], settings: { ...col.blocks[i].settings, ...updates.settings } };
                return doc;
              }
            }
          }
        }
      }
      return doc;
    });
  }, [updateDocument]);

  const handleAddBlock = useCallback((sectionId: string, block: EditorBlockData, afterBlockId?: string) => {
    updateDocument((doc) => {
      const section = doc.sections.find((s) => s.id === sectionId);
      if (!section || section.rows.length === 0) return doc;
      const lastRow = section.rows[section.rows.length - 1];
      const targetCol = lastRow.columns[lastRow.columns.length - 1];
      if (afterBlockId) {
        const idx = targetCol.blocks.findIndex((b) => b.id === afterBlockId);
        if (idx >= 0) {
          targetCol.blocks.splice(idx + 1, 0, block);
        } else {
          targetCol.blocks.push(block);
        }
      } else {
        targetCol.blocks.push(block);
      }
      return doc;
    });
    setSelectedBlockId(block.id);
  }, [updateDocument]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    updateDocument((doc) => {
      for (const section of doc.sections) {
        for (const row of section.rows) {
          for (const col of row.columns) {
            col.blocks = col.blocks.filter((b) => b.id !== blockId);
          }
        }
      }
      return doc;
    });
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }, [updateDocument, selectedBlockId]);

  const handleDuplicateBlock = useCallback((blockId: string) => {
    updateDocument((doc) => {
      for (const section of doc.sections) {
        for (const row of section.rows) {
          for (const col of row.columns) {
            for (let i = 0; i < col.blocks.length; i++) {
              if (col.blocks[i].id === blockId) {
                const dup = JSON.parse(JSON.stringify(col.blocks[i]));
                dup.id = generateId();
                col.blocks.splice(i + 1, 0, dup);
                return doc;
              }
            }
          }
        }
      }
      return doc;
    });
  }, [updateDocument]);

  const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    updateDocument((doc) => {
      for (const section of doc.sections) {
        for (const row of section.rows) {
          for (const col of row.columns) {
            const idx = col.blocks.findIndex((b) => b.id === blockId);
            if (idx < 0) continue;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= col.blocks.length) return doc;
            const [moved] = col.blocks.splice(idx, 1);
            col.blocks.splice(newIdx, 0, moved);
            return doc;
          }
        }
      }
      return doc;
    });
  }, [updateDocument]);

  const handleAddSection = useCallback(() => {
    updateDocument((doc) => {
      doc.sections.push(createSection(`Section ${doc.sections.length + 1}`));
      return doc;
    });
  }, [updateDocument]);

  const handleUpdateDocumentSettings = useCallback((settings: Partial<EditorDocument['settings']>) => {
    updateDocument((doc) => {
      doc.settings = { ...doc.settings, ...settings };
      return doc;
    });
  }, [updateDocument]);

  const handleInlineEdit = useCallback((blockId: string, text: string) => {
    updateDocument((doc) => {
      for (const section of doc.sections) {
        for (const row of section.rows) {
          for (const col of row.columns) {
            for (const block of col.blocks) {
              if (block.id === blockId) {
                block.data.text = text;
                return doc;
              }
            }
          }
        }
      }
      return doc;
    });
  }, [updateDocument]);

  const handleConvertToEditor = useCallback(() => {
    setCompatibilityBanner(false);
    const newDoc = createDefaultDocument();
    setDocument(newDoc);
    pushState(newDoc);
    save({
      editor_document: newDoc,
      is_legacy: false,
    }, true);
  }, [pushState, save]);

  const handleApplyBrand = useCallback((kit: BrandKit) => {
    setSelectedBrandId(kit.id);
    setShowBrandApply(true);
  }, []);

  const confirmApplyBrand = useCallback((kit: BrandKit, mode: 'newOnly' | 'preserve' | 'replace') => {
    updateDocument((doc) => {
      const colours = kit.colour_settings;
      const typography = kit.typography_settings;
      const buttons = kit.button_settings;
      const layout = kit.layout_settings;

      if (mode === 'replace') {
        if (colours) {
          doc.settings.defaultTextColor = colours.bodyText;
          doc.settings.defaultLinkColor = colours.link;
          doc.settings.outerBackground = colours.emailBg;
          doc.settings.contentBackground = colours.contentBg;
        }
        if (typography) {
          doc.settings.defaultFont = typography.bodyFont;
        }
        if (layout) {
          doc.settings.width = layout.emailWidth;
        }

        for (const section of doc.sections) {
          for (const row of section.rows) {
            for (const col of row.columns) {
              for (const block of col.blocks) {
                if (colours) {
                  if (['heading', 'text'].includes(block.type)) {
                    block.style.color = colours.bodyText;
                  }
                  if (block.type === 'button') {
                    block.style.backgroundColor = colours.primary;
                    block.style.color = colours.buttonText;
                  }
                  if (block.type === 'footer') {
                    block.style.backgroundColor = colours.secondary;
                    block.style.color = colours.mutedText;
                  }
                }
                if (buttons && block.type === 'button') {
                  block.style.borderRadius = buttons.borderRadius;
                  block.style.padding = `${buttons.vPadding} ${buttons.hPadding}`;
                  block.style.fontSize = buttons.fontSize;
                  block.style.fontWeight = buttons.fontWeight;
                }
                if (typography) {
                  if (block.type === 'heading') {
                    block.style.fontFamily = typography.headingFont;
                  }
                  if (block.type === 'text') {
                    block.style.fontFamily = typography.bodyFont;
                  }
                }
              }
            }
          }
        }
      } else if (mode === 'preserve') {
        if (colours) {
          doc.settings.defaultTextColor = colours.bodyText;
          doc.settings.defaultLinkColor = colours.link;
          doc.settings.outerBackground = colours.emailBg;
          doc.settings.contentBackground = colours.contentBg;
        }
        if (typography) doc.settings.defaultFont = typography.bodyFont;
        if (layout) doc.settings.width = layout.emailWidth;
      }

      return doc;
    });
    setShowBrandApply(false);
    setBrandApplyMode(mode);
  }, [updateDocument]);

  const handleUpdateBrand = useCallback(async (brandId: string | null) => {
    setSelectedBrandId(brandId);
    await supabase.from('email_templates').update({ brand_kit_id: brandId }).eq('id', template.id);
  }, [template.id]);

  const handleSaveAndExit = useCallback(async () => {
    await flush();
    const html = renderDocumentToHtml(docRef.current);
    await save({
      name: name.trim(),
      subject: subject.trim(),
      html_content: html,
      category,
      preview_text: previewText,
      editor_document: docRef.current,
      is_legacy: false,
      status: template.status || 'draft',
    }, true);
    lastSavedRef.current = true;
    if (onSaveAndExit) onSaveAndExit();
  }, [flush, save, name, subject, category, previewText, template.status, onSaveAndExit]);

  const handleDuplicate = useCallback(async () => {
    const html = renderDocumentToHtml(document);
    const { data: userData } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userData.user?.id || '').maybeSingle();
    const { error } = await supabase.from('email_templates').insert({
      name: `${name} Copy`,
      subject,
      html_content: html,
      category,
      variables: template.variables,
      editor_document: document,
      preview_text: previewText,
      status: 'draft',
      is_legacy: false,
      revision: 1,
      created_by: userData.user?.id,
      organisation_id: profileData?.organisation_id || null,
    });
    if (!error) {
      router.push('/admin/email/templates');
    }
  }, [document, name, subject, category, template.variables, previewText, router]);

  const runValidationHandler = useCallback(async () => {
    setValidationLoading(true);
    const html = renderDocumentToHtml(docRef.current);
    const result = runValidation({
      document: docRef.current,
      templateName: name.trim(),
      subject: subject.trim(),
      category: category || 'general',
      previewText: previewText || '',
      htmlContent: html,
      brandKitId: selectedBrandId,
      isLegacy: compatibilityBanner,
    });
    setValidationResult(result);
    setValidationOutdated(false);
    setValidationLoading(false);

    const { data: userData } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userData.user?.id || '').maybeSingle();
    await supabase.from('email_validation_runs').insert({
      template_id: template.id,
      result: result as unknown as Record<string, unknown>,
      status: 'completed',
      created_by: userData.user?.id,
      organisation_id: profileData?.organisation_id || null,
    });
  }, [name, subject, category, previewText, selectedBrandId, compatibilityBanner, template.id]);

  const handleNavigateToBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    setValidationOpen(false);
  }, []);

  const handleNavigateToSetting = useCallback((setting: string) => {
    setSelectedBlockId(null);
    setRightCollapsed(false);
    setValidationOpen(false);
  }, []);

  const createVersionSnapshot = useCallback(async (type: string, note?: string) => {
    const html = renderDocumentToHtml(docRef.current);
    const { data: userData } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userData.user?.id || '').maybeSingle();

    let nextVersion = (template.revision || 1) + 1;
    const { data: existing } = await supabase.from('email_template_versions').select('version_number').eq('template_id', template.id).order('version_number', { ascending: false }).limit(1);
    if (existing && existing.length > 0) nextVersion = (existing[0].version_number || 0) + 1;

    await supabase.from('email_template_versions').insert({
      template_id: template.id,
      version_number: nextVersion,
      version_type: type,
      editor_document: docRef.current,
      rendered_html: html,
      subject: subject.trim(),
      preview_text: previewText || null,
      brand_kit_id: selectedBrandId,
      validation_summary: validationResult ? { errors: validationResult.errors.length, warnings: validationResult.warnings.length, status: validationResult.status } : null,
      internal_note: note || null,
      status_at_creation: template.status || 'draft',
      created_by: userData.user?.id,
      organisation_id: profileData?.organisation_id || null,
    });

    await supabase.from('email_templates').update({ revision: nextVersion }).eq('id', template.id);
  }, [template.id, template.revision, template.status, subject, previewText, selectedBrandId, validationResult]);

  const handleRestoreVersion = useCallback(async (version: { id: string; editor_document?: EditorDocument | null; subject?: string | null; preview_text?: string | null }) => {
    const html = renderDocumentToHtml(docRef.current);
    const { data: userData } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userData.user?.id || '').maybeSingle();

    let nextVersion = (template.revision || 1) + 1;
    const { data: existing } = await supabase.from('email_template_versions').select('version_number').eq('template_id', template.id).order('version_number', { ascending: false }).limit(1);
    if (existing && existing.length > 0) nextVersion = (existing[0].version_number || 0) + 1;

    await supabase.from('email_template_versions').insert({
      template_id: template.id,
      version_number: nextVersion,
      version_type: 'restored',
      editor_document: docRef.current,
      rendered_html: html,
      subject: subject.trim(),
      preview_text: previewText || null,
      brand_kit_id: selectedBrandId,
      internal_note: `Restored from version snapshot`,
      status_at_creation: template.status || 'draft',
      created_by: userData.user?.id,
      organisation_id: profileData?.organisation_id || null,
    });

    if (version.editor_document) {
      setDocument(version.editor_document);
      pushState(version.editor_document);
    }
    if (version.subject) setSubject(version.subject);
    if (version.preview_text) setPreviewText(version.preview_text || '');

    await supabase.from('email_templates').update({
      status: 'draft',
      revision: nextVersion,
      editor_document: version.editor_document,
      subject: version.subject,
      preview_text: version.preview_text,
    }).eq('id', template.id);

    setHistoryOpen(false);
    setValidationOutdated(true);
  }, [template.id, template.revision, template.status, subject, previewText, selectedBrandId, pushState]);

  const handleOpenReview = useCallback(async () => {
    if (!validationResult || validationResult.errors.length > 0) {
      setValidationOpen(true);
      if (!validationResult) runValidationHandler();
      return;
    }
    setReviewOpen(true);
  }, [validationResult, runValidationHandler]);

  const handleOpenCompare = useCallback((versionA: { id: string }, versionB: { id: string }) => {
    setCompareVersions({ a: versionA, b: versionB });
    setCompareOpen(true);
  }, []);

  const handleSendTest = useCallback(() => {
    setShowSendTest(true);
  }, []);

  useEffect(() => {
    if (validationResult && !validationOutdated) {
      setValidationOutdated(true);
    }
  }, [document]);

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      <EditorToolbar
        templateName={name}
        onNameChange={setName}
        saveStatus={saveStatus}
        errorMessage={errorMessage}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => { const prev = undo(); if (prev) setDocument(prev); }}
        onRedo={() => { const next = redo(); if (next) setDocument(next); }}
        onSave={handleSave}
        onPreviewMode={() => setInlineEditing(!inlineEditing)}
        onDesktopPreview={() => { setPreviewMode('desktop'); setShowPreviewModal(true); }}
        onMobilePreview={() => { setPreviewMode('mobile'); setShowPreviewModal(true); }}
        onSendTest={handleSendTest}
        onDuplicate={handleDuplicate}
        onArchive={async () => {
          await supabase.from('email_templates').update({ status: 'archived' }).eq('id', template.id);
          router.push('/admin/email/templates');
        }}
        previewMode={previewMode}
        inlineEditing={inlineEditing}
        onValidate={() => { setValidationOpen(true); if (!validationResult) runValidationHandler(); }}
        onReview={handleOpenReview}
        onHistory={() => setHistoryOpen(true)}
        validationStatus={validationResult ? validationResult.status : 'not_checked'}
        onSaveAndExit={handleSaveAndExit}
      />

      {compatibilityBanner && (
        <div className="bg-amber-500/[0.06] border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-amber-400 text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-300">Legacy HTML Template</p>
              <p className="text-xs text-amber-400/70">This template uses raw HTML. Preview works but editing requires conversion.</p>
            </div>
          </div>
          <button
            onClick={handleConvertToEditor}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            Convert to Editor
          </button>
        </div>
      )}

      <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400">Brand:</span>
        </div>
        <select
          value={selectedBrandId || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'none') { handleUpdateBrand(null); return; }
            const kit = brandKits.find((k) => k.id === val);
            if (kit) handleApplyBrand(kit);
          }}
          className="px-3 py-1.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 cursor-pointer pr-8"
        >
          <option value="">DFP Default</option>
          {brandKits.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name}{kit.is_default ? ' (Default)' : ''}
            </option>
          ))}
          {selectedBrandId && !brandKits.find((k) => k.id === selectedBrandId) && (
            <option value={selectedBrandId}>Unknown brand</option>
          )}
          <option value="none">No brand</option>
        </select>
        {selectedBrandId && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[10px] text-[#06B6D4]">
            Applied
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center">✨</span>
            AI Assistant
          </button>

          {brandKits.filter((k) => k.id === selectedBrandId).map((kit) => (
            <Link key={kit.id} href={`/admin/email/brand-kits/${kit.id}`} className="text-[10px] text-slate-500 hover:text-[#06B6D4] transition-colors cursor-pointer whitespace-nowrap">
              Edit brand
            </Link>
          ))}
        </div>
      </div>

      {showBrandApply && selectedBrandId && (
        <div className="bg-[#06B6D4]/[0.04] border-b border-[#06B6D4]/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#06B6D4]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Palette className="w-3.5 h-3.5 text-[#06B6D4]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-2">Apply brand styles</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => confirmApplyBrand(brandKits.find((k) => k.id === selectedBrandId)!, 'newOnly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${brandApplyMode === 'newOnly' ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-300 hover:border-[rgba(255,255,255,0.15)]'}`}
                >
                  New blocks only
                </button>
                <button
                  onClick={() => confirmApplyBrand(brandKits.find((k) => k.id === selectedBrandId)!, 'preserve')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${brandApplyMode === 'preserve' ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-300 hover:border-[rgba(255,255,255,0.15)]'}`}
                >
                  Apply defaults
                </button>
                <button
                  onClick={() => confirmApplyBrand(brandKits.find((k) => k.id === selectedBrandId)!, 'replace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${brandApplyMode === 'replace' ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-300 hover:border-[rgba(255,255,255,0.15)]'}`}
                >
                  Replace all styles
                </button>
              </div>
              <button
                onClick={() => setShowBrandApply(false)}
                className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          collapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed(!leftCollapsed)}
          document={document}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={handleAddBlock}
          onMoveBlock={handleMoveBlock}
          onDeleteBlock={handleDeleteBlock}
          onAddSection={handleAddSection}
        />

        <CenterCanvas
          document={document}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onMoveBlock={handleMoveBlock}
          leftCollapsed={leftCollapsed}
          rightCollapsed={rightCollapsed}
          inlineEditing={inlineEditing}
          onInlineEdit={handleInlineEdit}
        />

        <RightPanel
          collapsed={rightCollapsed}
          onToggle={() => setRightCollapsed(!rightCollapsed)}
          document={document}
          selectedBlockId={selectedBlockId}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onUpdateDocumentSettings={handleUpdateDocumentSettings}
          onUpdateTemplateMeta={(meta) => {
            if (meta.name !== undefined) setName(meta.name);
            if (meta.subject !== undefined) setSubject(meta.subject);
            if (meta.category !== undefined) setCategory(meta.category);
            if (meta.previewText !== undefined) setPreviewText(meta.previewText);
          }}
          templateName={name}
          templateSubject={subject}
          templateCategory={category}
          templatePreviewText={previewText}
        />
      </div>

      <PreviewModal
        open={showPreviewModal}
        onClose={() => { setShowPreviewModal(false); setPreviewMode(null); }}
        document={document}
        subject={subject}
        templateName={name}
      />

      {showSendTest && (
        <EnhancedSendTestModal
          template={{
            id: template.id,
            name,
            subject,
            html_content: renderDocumentToHtml(document),
            variables: template.variables,
            category,
          }}
          document={document}
          brandKitId={selectedBrandId}
          onClose={() => setShowSendTest(false)}
          onSent={() => setShowSendTest(false)}
        />
      )}

      <ValidationPanel
        open={validationOpen}
        onClose={() => setValidationOpen(false)}
        result={validationResult}
        onRun={runValidationHandler}
        onNavigateToBlock={handleNavigateToBlock}
        onNavigateToSetting={handleNavigateToSetting}
        loading={validationLoading}
      />

      <ReviewPanel
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        template={template}
        document={document}
        subject={subject}
        previewText={previewText}
        validation={validationResult}
        currentUserId={currentUserId}
      />

      <VersionHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        templateId={template.id}
        currentDocument={document}
        onRestore={handleRestoreVersion}
        onCompare={handleOpenCompare}
      />

      <VersionCompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        versionA={compareVersions?.a || null}
        versionB={compareVersions?.b || null}
        templateId={template.id}
      />

      <AIDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        templateId={template.id}
        brandKitId={selectedBrandId}
        editorDocument={document}
        selectedText={selectedText}
        subject={subject}
        previewText={previewText}
        onApplySubject={(s) => setSubject(s)}
        onApplyPreviewText={(p) => setPreviewText(p)}
        onInsertText={(text) => {
          const block = createBlock('text');
          block.data.text = text;
          if (document.sections.length > 0 && document.sections[0].rows.length > 0) {
            const lastRow = document.sections[0].rows[document.sections[0].rows.length - 1];
            const lastCol = lastRow.columns[lastRow.columns.length - 1];
            const newBlock = { ...block, id: generateId() };
            lastCol.blocks.push(newBlock);
            updateDocument((doc) => doc);
          }
        }}
      />
    </div>
  );
}