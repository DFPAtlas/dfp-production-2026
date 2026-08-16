import { EditorDocument, EditorSection, EditorRow, EditorColumn, EditorBlockData, BLOCK_DEFINITIONS } from './editor-types';

let idCounter = 0;
export function generateId(): string {
  idCounter++;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultDocument(): EditorDocument {
  return {
    version: 1,
    settings: {
      width: 600,
      outerBackground: '#f1f5f9',
      contentBackground: '#ffffff',
      defaultFont: 'Arial, sans-serif',
      defaultTextColor: '#1e293b',
      defaultLinkColor: '#06B6D4',
      defaultSpacing: 16,
      mobileBreakpoint: 480,
    },
    sections: [
      {
        id: generateId(),
        label: 'Header',
        rows: [
          {
            id: generateId(),
            columns: [
              { id: generateId(), width: 100, blocks: [createBlock('logo', { src: '', alt: 'Digital Footprint' })] },
            ],
          },
        ],
      },
      {
        id: generateId(),
        label: 'Content',
        rows: [
          {
            id: generateId(),
            columns: [
              { id: generateId(), width: 100, blocks: [
                createBlock('heading', { text: 'Hello {{first_name}},' }),
                createBlock('text', { text: 'Welcome to Digital Footprint. We are excited to have you on board.' }),
                createBlock('spacer'),
                createBlock('button', { text: 'Get Started', url: '#' }),
              ] },
            ],
          },
        ],
      },
      {
        id: generateId(),
        label: 'Footer',
        rows: [
          {
            id: generateId(),
            columns: [
              { id: generateId(), width: 100, blocks: [
                createBlock('divider'),
                createBlock('footer', { company: 'Digital Footprint', address: 'London, UK' }),
                createBlock('unsubscribe'),
              ] },
            ],
          },
        ],
      },
    ],
  };
}

export function createBlock(type: string, overrides?: Record<string, unknown>): EditorBlockData {
  const def = BLOCK_DEFINITIONS[type];
  return {
    id: generateId(),
    type,
    data: { ...(def?.defaultData || {}), ...(overrides || {}) },
    style: { ...(def?.defaultStyle || {}) },
    settings: { visibleDesktop: true, visibleMobile: true, internalLabel: '' },
  };
}

export function createRow(columns: number = 1): EditorRow {
  const cols: EditorColumn[] = [];
  const colWidth = Math.floor(100 / columns);
  let remaining = 100;
  for (let i = 0; i < columns; i++) {
    const w = i === columns - 1 ? remaining : colWidth;
    remaining -= w;
    cols.push({ id: generateId(), width: w, blocks: [createBlock('text')] });
  }
  return { id: generateId(), columns: cols };
}

export function createSection(label: string): EditorSection {
  return { id: generateId(), label, rows: [createRow(1)] };
}

export function renderDocumentToHtml(doc: EditorDocument): string {
  const { settings } = doc;
  let html = '';

  const wrapEmail = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${settings.outerBackground};font-family:${settings.defaultFont};">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${settings.outerBackground};">
  <tr><td align="center" style="padding:20px 0;">
    <table width="${settings.width}" cellpadding="0" cellspacing="0" style="background-color:${settings.contentBackground};max-width:${settings.width}px;">
      ${content}
    </table>
  </td></tr>
</table>
</body>
</html>`;

  for (const section of doc.sections) {
    if (!section.rows || section.rows.length === 0) continue;
    for (const row of section.rows) {
      html += '<tr>';
      for (const col of row.columns) {
        html += `<td valign="top" style="width:${col.width}%;padding:0;">`;
        html += '<table width="100%" cellpadding="0" cellspacing="0"><tr><td>';
        for (const block of col.blocks) {
          html += renderBlockToHtml(block, settings);
        }
        html += '</td></tr></table>';
        html += '</td>';
      }
      html += '</tr>';
    }
  }

  return wrapEmail(html);
}

function renderBlockToHtml(block: EditorBlockData, settings: EditorDocument['settings']): string {
  const style = { ...block.style };
  const data = { ...block.data };
  const type = block.type;

  const inlineStyle = styleObjToInline(style);

  switch (type) {
    case 'heading': {
      const level = (data.level as string) || 'h2';
      const tag = level === 'h1' ? 'h1' : level === 'h3' ? 'h3' : 'h2';
      return `<${tag} style="${inlineStyle}">${escapeHtml(data.text as string || '')}</${tag}>`;
    }
    case 'text':
      return `<p style="${inlineStyle}">${escapeHtml(data.text as string || '')}</p>`;
    case 'image': {
      const src = data.src as string || '';
      const alt = escapeAttr(data.alt as string || '');
      const imgStyle = `max-width:100%;height:auto;display:block;border-radius:${style.borderRadius || '0px'};`;
      let imgHtml = `<img src="${src}" alt="${alt}" style="${imgStyle}" />`;
      if (data.link) {
        imgHtml = `<a href="${data.link}" target="_blank">${imgHtml}</a>`;
      }
      return `<div style="${inlineStyle}">${imgHtml}</div>`;
    }
    case 'button': {
      const btnStyle = `display:inline-block;background-color:${style.backgroundColor || '#06B6D4'};color:${style.color || '#ffffff'};border-radius:${style.borderRadius || '8px'};padding:${style.padding || '12px 32px'};font-weight:${style.fontWeight || 'bold'};font-size:${style.fontSize || '14px'};text-decoration:none;text-align:center;`;
      return `<div style="${inlineStyle}"><a href="${data.url || '#'}" style="${btnStyle}" target="_blank">${escapeHtml(data.text as string || 'Click Here')}</a></div>`;
    }
    case 'divider': {
      const dStyle = `width:${style.width || '100%'};border-top:${style.thickness || '1px'} ${style.style || 'solid'} ${style.color || '#e2e8f0'};margin:0;`;
      return `<div style="${inlineStyle}"><hr style="${dStyle}" /></div>`;
    }
    case 'spacer':
      return `<div style="height:${style.height || '24px'};line-height:0;font-size:0;">&nbsp;</div>`;
    case 'logo': {
      const src = data.src as string || '';
      const alt = escapeAttr(data.alt as string || 'Logo');
      let logoHtml = `<img src="${src}" alt="${alt}" style="max-width:${style.width || '140px'};height:auto;display:block;" />`;
      if (data.link) logoHtml = `<a href="${data.link}" target="_blank">${logoHtml}</a>`;
      return `<div style="${inlineStyle}">${logoHtml}</div>`;
    }
    case 'featureCard': {
      const cardStyle = `background-color:${style.backgroundColor || '#f8fafc'};border-radius:${style.borderRadius || '12px'};padding:${style.padding || '24px'};border:1px solid ${style.borderColor || '#e2e8f0'};`;
      return `<div style="${inlineStyle}"><div style="${cardStyle}"><h3 style="margin:0 0 8px;font-size:16px;color:${settings.defaultTextColor};">${escapeHtml(data.title as string || '')}</h3><p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(data.description as string || '')}</p></div></div>`;
    }
    case 'contactDetails': {
      let contactHtml = '';
      if (data.company) contactHtml += `<p style="margin:0 0 4px;font-weight:bold;">${escapeHtml(data.company as string)}</p>`;
      if (data.address) contactHtml += `<p style="margin:0 0 4px;">${escapeHtml(data.address as string)}</p>`;
      if (data.email) contactHtml += `<p style="margin:0 0 4px;"><a href="mailto:${data.email}" style="color:${settings.defaultLinkColor};">${escapeHtml(data.email as string)}</a></p>`;
      if (data.phone) contactHtml += `<p style="margin:0 0 4px;">${escapeHtml(data.phone as string)}</p>`;
      if (data.website) contactHtml += `<p style="margin:0 0 4px;"><a href="${data.website}" style="color:${settings.defaultLinkColor};">${escapeHtml(data.website as string)}</a></p>`;
      return `<div style="${inlineStyle}">${contactHtml}</div>`;
    }
    case 'socialLinks': {
      const links = (data.links as Array<{ platform: string; url: string }>) || [];
      const iconsHtml = links.map((l) => {
        const label = l.platform.charAt(0).toUpperCase() + l.platform.slice(1);
        return `<a href="${l.url}" target="_blank" style="display:inline-block;margin:0 ${Number(style.gap || 12) / 2}px;color:${style.color || '#64748b'};text-decoration:none;font-size:${style.iconSize || '24px'};">${label}</a>`;
      }).join('');
      return `<div style="${inlineStyle}">${iconsHtml}</div>`;
    }
    case 'header': {
      const headerStyle = `background-color:${style.backgroundColor || '#ffffff'};padding:${style.padding || '24px'};text-align:${style.textAlign || 'center'};border-bottom:${style.borderBottom || '1px solid #e2e8f0'};`;
      return `<div style="${headerStyle}"><span style="font-size:18px;font-weight:bold;color:${settings.defaultTextColor};">${escapeHtml(data.title as string || '')}</span></div>`;
    }
    case 'footer': {
      const footerStyle = `background-color:${style.backgroundColor || '#f8fafc'};padding:${style.padding || '24px'};text-align:${style.textAlign || 'center'};font-size:${style.fontSize || '12px'};color:${style.color || '#94a3b8'};`;
      let footerHtml = `<p style="margin:0 0 4px;">&copy; ${new Date().getFullYear()} ${escapeHtml(data.company as string || 'Digital Footprint')}</p>`;
      if (data.address) footerHtml += `<p style="margin:0 0 4px;">${escapeHtml(data.address as string)}</p>`;
      if (data.unsubscribeUrl) footerHtml += `<p style="margin:8px 0 0;"><a href="${data.unsubscribeUrl}" style="color:${style.color || '#94a3b8'};">${escapeHtml(data.unsubscribeText as string || 'Unsubscribe')}</a></p>`;
      return `<div style="${footerStyle}">${footerHtml}</div>`;
    }
    case 'unsubscribe': {
      return `<div style="${inlineStyle}"><a href="${data.url || '#'}" style="color:${style.color || '#94a3b8'};text-decoration:underline;">${escapeHtml(data.text as string || 'Unsubscribe')}</a></div>`;
    }
    case 'viewInBrowser': {
      return `<div style="${inlineStyle}"><a href="#" style="color:${style.color || '#64748b'};text-decoration:underline;">${escapeHtml(data.text as string || 'View in browser')}</a></div>`;
    }
    case 'oneColumn':
      return `<div style="${inlineStyle}"></div>`;
    case 'twoColumns':
    case 'threeColumns':
      return `<div style="${inlineStyle}"></div>`;
    default:
      return '';
  }
}

function styleObjToInline(obj: Record<string, unknown>): string {
  const cssProps: Record<string, string> = {
    fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight',
    color: 'color', textAlign: 'text-align', padding: 'padding', margin: 'margin',
    lineHeight: 'line-height', backgroundColor: 'background-color', borderRadius: 'border-radius',
    width: 'width', height: 'height', display: 'display', border: 'border',
    maxWidth: 'max-width', borderBottom: 'border-bottom', textDecoration: 'text-decoration',
    borderColor: 'border-color',
  };
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${cssProps[k] || k}:${v}`)
    .join(';');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}