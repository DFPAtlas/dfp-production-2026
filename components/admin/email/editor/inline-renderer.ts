import { EditorBlockData, EditorDocument } from './editor-types';

function escapeHtmlInline(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function styleObjToInline(obj: Record<string, unknown>): string {
  const cssProps: Record<string, string> = {
    fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight',
    color: 'color', textAlign: 'text-align', padding: 'padding', margin: 'margin',
    lineHeight: 'line-height', backgroundColor: 'background-color', borderRadius: 'border-radius',
    width: 'width', height: 'height', display: 'display', border: 'border',
    maxWidth: 'max-width', borderBottom: 'border-bottom', textDecoration: 'text-decoration',
    borderColor: 'border-color', minHeight: 'min-height',
  };
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${cssProps[k] || k}:${v}`)
    .join(';');
}

export function renderBlockToInline(block: EditorBlockData, settings: EditorDocument['settings'], linkColor: string): string {
  const style = { ...block.style };
  const data = { ...block.data };
  const inlineStyle = styleObjToInline(style);

  switch (block.type) {
    case 'heading': {
      const level = (data.level as string) || 'h2';
      const tag = level === 'h1' ? 'h1' : level === 'h3' ? 'h3' : 'h2';
      return `<${tag} style="${inlineStyle}">${escapeHtmlInline(data.text as string || '')}</${tag}>`;
    }
    case 'text':
      return `<p style="${inlineStyle}">${escapeHtmlInline(data.text as string || '')}</p>`;
    case 'image': {
      const src = data.src as string || '';
      const alt = escapeHtmlInline(data.alt as string || '');
      if (!src) {
        return `<div style="${inlineStyle};background:#f1f5f9;min-height:120px;display:flex;align-items:center;justify-content:center;border:2px dashed #cbd5e1;border-radius:${style.borderRadius || '0px'};"><span style="color:#94a3b8;font-size:13px;">Image placeholder</span></div>`;
      }
      const imgStyle = `max-width:100%;height:auto;display:block;border-radius:${style.borderRadius || '0px'};`;
      let imgHtml = `<img src="${src}" alt="${alt}" style="${imgStyle}" />`;
      if (data.link) imgHtml = `<a href="${data.link}" target="_blank" rel="noopener">${imgHtml}</a>`;
      return `<div style="${inlineStyle}">${imgHtml}</div>`;
    }
    case 'button': {
      const btnStyle = `display:inline-block;background-color:${style.backgroundColor || '#06B6D4'};color:${style.color || '#ffffff'};border-radius:${style.borderRadius || '8px'};padding:${style.padding || '12px 32px'};font-weight:${style.fontWeight || 'bold'};font-size:${style.fontSize || '14px'};text-decoration:none;text-align:center;`;
      return `<div style="${inlineStyle}"><a href="${data.url || '#'}" style="${btnStyle}" target="_blank" rel="noopener">${escapeHtmlInline(data.text as string || 'Click Here')}</a></div>`;
    }
    case 'divider':
      return `<div style="${inlineStyle}"><hr style="width:${style.width || '100%'};border:none;border-top:${style.thickness || '1px'} ${style.style || 'solid'} ${style.color || '#e2e8f0'};margin:0;" /></div>`;
    case 'spacer':
      return `<div style="height:${style.height || '24px'};line-height:0;font-size:0;${inlineStyle}">&nbsp;</div>`;
    case 'logo': {
      const src = data.src as string || '';
      const alt = escapeHtmlInline(data.alt as string || 'Logo');
      if (!src) return `<div style="${inlineStyle};padding:12px;text-align:center;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:8px;"><span style="color:#94a3b8;font-size:13px;">Logo placeholder</span></div>`;
      let html = `<img src="${src}" alt="${alt}" style="max-width:${style.width || '140px'};height:auto;display:block;" />`;
      if (data.link) html = `<a href="${data.link}" target="_blank" rel="noopener">${html}</a>`;
      return `<div style="${inlineStyle}">${html}</div>`;
    }
    case 'featureCard': {
      const cardStyle = `background-color:${style.backgroundColor || '#f8fafc'};border-radius:${style.borderRadius || '12px'};padding:${style.padding || '24px'};border:1px solid ${style.borderColor || '#e2e8f0'};`;
      return `<div style="${inlineStyle}"><div style="${cardStyle}"><h3 style="margin:0 0 8px;font-size:16px;color:${settings.defaultTextColor};">${escapeHtmlInline(data.title as string || '')}</h3><p style="margin:0;font-size:14px;color:#64748b;">${escapeHtmlInline(data.description as string || '')}</p></div></div>`;
    }
    case 'contactDetails': {
      let html = '';
      if (data.company) html += `<p style="margin:0 0 4px;font-weight:bold;">${escapeHtmlInline(data.company as string)}</p>`;
      if (data.address) html += `<p style="margin:0 0 4px;">${escapeHtmlInline(data.address as string)}</p>`;
      if (data.email) html += `<p style="margin:0 0 4px;"><a href="mailto:${data.email}" style="color:${linkColor};">${escapeHtmlInline(data.email as string)}</a></p>`;
      if (data.phone) html += `<p style="margin:0 0 4px;">${escapeHtmlInline(data.phone as string)}</p>`;
      if (data.website) html += `<p style="margin:0 0 4px;"><a href="${data.website}" target="_blank" rel="noopener" style="color:${linkColor};">${escapeHtmlInline(data.website as string)}</a></p>`;
      return `<div style="${inlineStyle}">${html}</div>`;
    }
    case 'socialLinks': {
      const links = (data.links as Array<{ platform: string; url: string }>) || [];
      if (links.length === 0) return `<div style="${inlineStyle};padding:12px;text-align:center;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:8px;"><span style="color:#94a3b8;font-size:13px;">Social Links placeholder</span></div>`;
      const iconsHtml = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" style="display:inline-block;margin:0 ${Number(style.gap || 12) / 2}px;color:${style.color || '#64748b'};text-decoration:none;font-size:${style.iconSize || '24px'};">${escapeHtmlInline(l.platform)}</a>`).join('');
      return `<div style="${inlineStyle}">${iconsHtml}</div>`;
    }
    case 'header':
      return `<div style="background-color:${style.backgroundColor || '#ffffff'};padding:${style.padding || '24px'};text-align:${style.textAlign || 'center'};border-bottom:${style.borderBottom || '1px solid #e2e8f0'};${inlineStyle}"><span style="font-size:18px;font-weight:bold;color:${settings.defaultTextColor};">${escapeHtmlInline(data.title as string || 'Digital Footprint')}</span></div>`;
    case 'footer': {
      let html = `<p style="margin:0 0 4px;">&copy; ${new Date().getFullYear()} ${escapeHtmlInline(data.company as string || 'Digital Footprint')}</p>`;
      if (data.address) html += `<p style="margin:0 0 4px;">${escapeHtmlInline(data.address as string)}</p>`;
      if (data.unsubscribeUrl) html += `<p style="margin:8px 0 0;"><a href="${data.unsubscribeUrl}" style="color:${style.color || '#94a3b8'};">${escapeHtmlInline(data.unsubscribeText as string || 'Unsubscribe')}</a></p>`;
      return `<div style="background-color:${style.backgroundColor || '#f8fafc'};padding:${style.padding || '24px'};text-align:${style.textAlign || 'center'};font-size:${style.fontSize || '12px'};color:${style.color || '#94a3b8'};${inlineStyle}">${html}</div>`;
    }
    case 'unsubscribe':
      return `<div style="${inlineStyle}"><a href="${data.url || '#'}" style="color:${style.color || '#94a3b8'};text-decoration:underline;">${escapeHtmlInline(data.text as string || 'Unsubscribe')}</a></div>`;
    case 'viewInBrowser':
      return `<div style="${inlineStyle}"><a href="#" style="color:${style.color || '#64748b'};text-decoration:underline;">${escapeHtmlInline(data.text as string || 'View in browser')}</a></div>`;
    case 'oneColumn':
    case 'twoColumns':
    case 'threeColumns':
      return `<div style="${inlineStyle};min-height:40px;background:rgba(6,182,212,0.02);border:1px dashed rgba(6,182,212,0.15);border-radius:4px;display:flex;align-items:center;justify-content:center;"><span style="color:rgba(6,182,212,0.4);font-size:11px;">${BLOCK_DEFINITIONS_LABEL[block.type] || block.type}</span></div>`;
    case 'preheader':
      return `<div style="display:none;">${escapeHtmlInline(data.text as string || '')}</div>`;
    default:
      return `<div style="${inlineStyle}">[${block.type}]</div>`;
  }
}

const BLOCK_DEFINITIONS_LABEL: Record<string, string> = {
  oneColumn: '1 Column', twoColumns: '2 Columns', threeColumns: '3 Columns',
};