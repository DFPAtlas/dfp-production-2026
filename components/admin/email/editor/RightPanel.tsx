'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Palette, FileText, Trash2, Copy, Tag } from 'lucide-react';
import { EditorDocument, EditorBlockData, BLOCK_DEFINITIONS, MERGE_TAGS } from './editor-types';
import { findBlock } from './CenterCanvas';

interface RightPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  document: EditorDocument;
  selectedBlockId: string | null;
  onUpdateBlock: (blockId: string, updates: { data?: Record<string, unknown>; style?: Record<string, unknown>; settings?: Record<string, unknown> }) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateDocumentSettings: (settings: Partial<EditorDocument['settings']>) => void;
  onUpdateTemplateMeta: (meta: { name?: string; subject?: string; category?: string; previewText?: string }) => void;
  templateName: string;
  templateSubject: string;
  templateCategory: string;
  templatePreviewText: string;
}

type TabType = 'content' | 'style' | 'settings';

export default function RightPanel({
  collapsed, onToggle, document, selectedBlockId,
  onUpdateBlock, onDeleteBlock, onDuplicateBlock,
  onUpdateDocumentSettings, onUpdateTemplateMeta,
  templateName, templateSubject, templateCategory, templatePreviewText,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');

  if (collapsed) {
    return (
      <div className="w-12 bg-[#0a0a0c] border-l border-[rgba(255,255,255,0.06)] flex flex-col items-center py-3 gap-1 shrink-0">
        <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white cursor-pointer" title="Expand panel">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => { setActiveTab('content'); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer" title="Content">
          <FileText className="w-4 h-4" />
        </button>
        <button onClick={() => { setActiveTab('style'); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer" title="Style">
          <Palette className="w-4 h-4" />
        </button>
        <button onClick={() => { setActiveTab('settings'); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer" title="Settings">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const selectedBlock = selectedBlockId ? findBlock(document, selectedBlockId) : null;

  return (
    <div className="w-[320px] bg-[#0a0a0c] border-l border-[rgba(255,255,255,0.06)] flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'content' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'style' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>
        <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white cursor-pointer" title="Collapse">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedBlock ? (
          <BlockProperties
            block={selectedBlock}
            activeTab={activeTab}
            onUpdate={(updates) => onUpdateBlock(selectedBlock.id, updates)}
            onDelete={() => onDeleteBlock(selectedBlock.id)}
            onDuplicate={() => onDuplicateBlock(selectedBlock.id)}
          />
        ) : (
          <GlobalSettings
            document={document}
            activeTab={activeTab}
            onUpdateSettings={onUpdateDocumentSettings}
            templateName={templateName}
            templateSubject={templateSubject}
            templateCategory={templateCategory}
            templatePreviewText={templatePreviewText}
            onUpdateMeta={onUpdateTemplateMeta}
          />
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{children}</label>;
}

function TextInput({ value, onChange, placeholder, multiline }: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls = 'w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all';
  if (multiline) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-y`} />;
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.06)] cursor-pointer bg-transparent p-0.5" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all" />
    </div>
  );
}

function BlockProperties({ block, activeTab, onUpdate, onDelete, onDuplicate }: {
  block: EditorBlockData;
  activeTab: TabType;
  onUpdate: (updates: { data?: Record<string, unknown>; style?: Record<string, unknown>; settings?: Record<string, unknown> }) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const updateData = (key: string, value: unknown) => onUpdate({ data: { ...block.data, [key]: value } });
  const updateStyle = (key: string, value: unknown) => onUpdate({ style: { ...block.style, [key]: value } });
  const updateSettings = (key: string, value: unknown) => onUpdate({ settings: { ...block.settings, [key]: value } });

  const def = BLOCK_DEFINITIONS[block.type];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{def?.label || block.type}</p>
        </div>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-4">
          {['heading', 'text'].includes(block.type) && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FieldLabel>Text</FieldLabel>
                  <MergeTagButton onInsert={(tag) => updateData('text', ((block.data.text as string) || '') + ` {{${tag}}}`)} />
                </div>
                <TextInput value={block.data.text as string || ''} onChange={(v) => updateData('text', v)} multiline />
              </div>
              {block.type === 'heading' && (
                <div>
                  <FieldLabel>Level</FieldLabel>
                  <div className="flex gap-1">
                    {['h1', 'h2', 'h3'].map((l) => (
                      <button key={l} onClick={() => updateData('level', l)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          (block.data.level || 'h2') === l ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {block.type === 'image' && (
            <>
              <div>
                <FieldLabel>Image URL</FieldLabel>
                <TextInput value={block.data.src as string || ''} onChange={(v) => updateData('src', v)} placeholder="https://..." />
              </div>
              <div>
                <FieldLabel>Alt Text</FieldLabel>
                <TextInput value={block.data.alt as string || ''} onChange={(v) => updateData('alt', v)} />
              </div>
              <div>
                <FieldLabel>Link URL</FieldLabel>
                <TextInput value={block.data.link as string || ''} onChange={(v) => updateData('link', v)} placeholder="https://..." />
              </div>
            </>
          )}

          {block.type === 'button' && (
            <>
              <div>
                <FieldLabel>Button Text</FieldLabel>
                <TextInput value={block.data.text as string || 'Click Here'} onChange={(v) => updateData('text', v)} />
              </div>
              <div>
                <FieldLabel>URL</FieldLabel>
                <TextInput value={block.data.url as string || '#'} onChange={(v) => updateData('url', v)} />
              </div>
            </>
          )}

          {block.type === 'divider' && (
            <>
              <div>
                <FieldLabel>Thickness</FieldLabel>
                <TextInput value={block.style.thickness as string || '1px'} onChange={(v) => updateStyle('thickness', v)} />
              </div>
              <div>
                <FieldLabel>Style</FieldLabel>
                <div className="flex gap-1">
                  {['solid', 'dashed', 'dotted'].map((s) => (
                    <button key={s} onClick={() => updateStyle('style', s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                        (block.style.style || 'solid') === s ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {block.type === 'spacer' && (
            <div>
              <FieldLabel>Height</FieldLabel>
              <TextInput value={block.style.height as string || '24px'} onChange={(v) => updateStyle('height', v)} />
            </div>
          )}

          {block.type === 'logo' && (
            <>
              <div>
                <FieldLabel>Logo URL</FieldLabel>
                <TextInput value={block.data.src as string || ''} onChange={(v) => updateData('src', v)} />
              </div>
              <div>
                <FieldLabel>Alt Text</FieldLabel>
                <TextInput value={block.data.alt as string || ''} onChange={(v) => updateData('alt', v)} />
              </div>
              <div>
                <FieldLabel>Link</FieldLabel>
                <TextInput value={block.data.link as string || ''} onChange={(v) => updateData('link', v)} />
              </div>
            </>
          )}

          {block.type === 'featureCard' && (
            <>
              <div>
                <FieldLabel>Title</FieldLabel>
                <TextInput value={block.data.title as string || ''} onChange={(v) => updateData('title', v)} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextInput value={block.data.description as string || ''} onChange={(v) => updateData('description', v)} multiline />
              </div>
            </>
          )}

          {block.type === 'contactDetails' && (
            <>
              <div><FieldLabel>Company</FieldLabel><TextInput value={block.data.company as string || ''} onChange={(v) => updateData('company', v)} /></div>
              <div><FieldLabel>Address</FieldLabel><TextInput value={block.data.address as string || ''} onChange={(v) => updateData('address', v)} /></div>
              <div><FieldLabel>Email</FieldLabel><TextInput value={block.data.email as string || ''} onChange={(v) => updateData('email', v)} /></div>
              <div><FieldLabel>Phone</FieldLabel><TextInput value={block.data.phone as string || ''} onChange={(v) => updateData('phone', v)} /></div>
              <div><FieldLabel>Website</FieldLabel><TextInput value={block.data.website as string || ''} onChange={(v) => updateData('website', v)} /></div>
            </>
          )}

          {block.type === 'socialLinks' && (
            <div>
              <FieldLabel>Social Links</FieldLabel>
              <p className="text-[10px] text-slate-500 mb-2">Add platform and URL pairs</p>
              {((block.data.links as Array<{ platform: string; url: string }>) || []).map((link, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={link.platform} onChange={(e) => {
                    const links = [...(block.data.links as Array<{ platform: string; url: string }>) || []];
                    links[i] = { ...links[i], platform: e.target.value };
                    updateData('links', links);
                  }}
                  placeholder="Platform" className="flex-1 px-2 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                  <input type="text" value={link.url} onChange={(e) => {
                    const links = [...(block.data.links as Array<{ platform: string; url: string }>) || []];
                    links[i] = { ...links[i], url: e.target.value };
                    updateData('links', links);
                  }}
                  placeholder="URL" className="flex-1 px-2 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                  <button onClick={() => {
                    const links = [...(block.data.links as Array<{ platform: string; url: string }>) || []];
                    links.splice(i, 1);
                    updateData('links', links);
                  }} className="text-slate-500 hover:text-red-400 text-xs cursor-pointer">&times;</button>
                </div>
              ))}
              <button onClick={() => {
                const links = [...(block.data.links as Array<{ platform: string; url: string }>) || []];
                links.push({ platform: '', url: '' });
                updateData('links', links);
              }} className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer">+ Add Link</button>
            </div>
          )}

          {(block.type === 'header' || block.type === 'footer') && (
            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={block.data.title as string || ''} onChange={(v) => updateData('title', v)} />
            </div>
          )}

          {block.type === 'unsubscribe' && (
            <>
              <div><FieldLabel>Text</FieldLabel><TextInput value={block.data.text as string || ''} onChange={(v) => updateData('text', v)} /></div>
              <div><FieldLabel>URL</FieldLabel><TextInput value={block.data.url as string || ''} onChange={(v) => updateData('url', v)} /></div>
            </>
          )}
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-4">
          {(block.type === 'heading' || block.type === 'text' || block.type === 'button') && (
            <>
              <div>
                <FieldLabel>Text Align</FieldLabel>
                <div className="flex gap-1">
                  {['left', 'center', 'right'].map((a) => (
                    <button key={a} onClick={() => updateStyle('textAlign', a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                        (block.style.textAlign || 'left') === a ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Text Color</FieldLabel>
                <ColorInput value={block.style.color as string || '#1e293b'} onChange={(v) => updateStyle('color', v)} />
              </div>
              <div>
                <FieldLabel>Font Size</FieldLabel>
                <TextInput value={block.style.fontSize as string || '14px'} onChange={(v) => updateStyle('fontSize', v)} />
              </div>
            </>
          )}

          {(block.type === 'button') && (
            <>
              <div>
                <FieldLabel>Background</FieldLabel>
                <ColorInput value={block.style.backgroundColor as string || '#06B6D4'} onChange={(v) => updateStyle('backgroundColor', v)} />
              </div>
              <div>
                <FieldLabel>Text Color</FieldLabel>
                <ColorInput value={block.style.color as string || '#ffffff'} onChange={(v) => updateStyle('color', v)} />
              </div>
              <div>
                <FieldLabel>Border Radius</FieldLabel>
                <TextInput value={block.style.borderRadius as string || '8px'} onChange={(v) => updateStyle('borderRadius', v)} />
              </div>
              <div>
                <FieldLabel>Padding</FieldLabel>
                <TextInput value={block.style.padding as string || '12px 32px'} onChange={(v) => updateStyle('padding', v)} />
              </div>
            </>
          )}

          {block.type === 'divider' && (
            <div>
              <FieldLabel>Color</FieldLabel>
              <ColorInput value={block.style.color as string || '#e2e8f0'} onChange={(v) => updateStyle('color', v)} />
            </div>
          )}

          {['image', 'logo', 'featureCard', 'button', 'header', 'footer'].includes(block.type) && (
            <div>
              <FieldLabel>Border Radius</FieldLabel>
              <TextInput value={block.style.borderRadius as string || '0px'} onChange={(v) => updateStyle('borderRadius', v)} />
            </div>
          )}

          {['featureCard', 'header', 'footer', 'contactDetails'].includes(block.type) && (
            <>
              <div>
                <FieldLabel>Background</FieldLabel>
                <ColorInput value={block.style.backgroundColor as string || '#ffffff'} onChange={(v) => updateStyle('backgroundColor', v)} />
              </div>
              <div>
                <FieldLabel>Padding</FieldLabel>
                <TextInput value={block.style.padding as string || '24px'} onChange={(v) => updateStyle('padding', v)} />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div>
            <FieldLabel>Internal Label</FieldLabel>
            <TextInput value={block.settings.internalLabel as string || ''} onChange={(v) => updateSettings('internalLabel', v)} placeholder="e.g. Hero heading" />
          </div>
          <div>
            <FieldLabel>Visibility</FieldLabel>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(block.settings.visibleDesktop as boolean) !== false}
                  onChange={(e) => updateSettings('visibleDesktop', e.target.checked)}
                  className="sr-only peer" />
                <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.1)] peer-checked:bg-[#06B6D4] peer-checked:border-[#06B6D4] flex items-center justify-center transition-colors">
                  {(block.settings.visibleDesktop as boolean) !== false && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-xs text-slate-300">Desktop</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(block.settings.visibleMobile as boolean) !== false}
                  onChange={(e) => updateSettings('visibleMobile', e.target.checked)}
                  className="sr-only peer" />
                <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.1)] peer-checked:bg-[#06B6D4] peer-checked:border-[#06B6D4] flex items-center justify-center transition-colors">
                  {(block.settings.visibleMobile as boolean) !== false && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-xs text-slate-300">Mobile</span>
              </label>
            </div>
          </div>
          <div className="pt-4 space-y-2 border-t border-[rgba(255,255,255,0.06)]">
            <button onClick={onDuplicate} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white text-xs transition-colors cursor-pointer">
              <Copy className="w-3.5 h-3.5" /> Duplicate Block
            </button>
            <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs transition-colors cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Delete Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GlobalSettings({ document, activeTab, onUpdateSettings, templateName, templateSubject, templateCategory, templatePreviewText, onUpdateMeta }: {
  document: EditorDocument;
  activeTab: TabType;
  onUpdateSettings: (s: Partial<EditorDocument['settings']>) => void;
  templateName: string;
  templateSubject: string;
  templateCategory: string;
  templatePreviewText: string;
  onUpdateMeta: (m: { name?: string; subject?: string; category?: string; previewText?: string }) => void;
}) {
  const s = document.settings;

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <p className="text-sm font-semibold text-white">Email Settings</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Global template configuration</p>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-4">
          <div>
            <FieldLabel>Template Name</FieldLabel>
            <TextInput value={templateName} onChange={(v) => onUpdateMeta({ name: v })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel>Subject Line</FieldLabel>
              <MergeTagButton onInsert={(tag) => onUpdateMeta({ subject: templateSubject + ` {{${tag}}}` })} />
            </div>
            <TextInput value={templateSubject} onChange={(v) => onUpdateMeta({ subject: v })} placeholder="Email subject line" />
          </div>
          <div>
            <FieldLabel>Preview Text</FieldLabel>
            <TextInput value={templatePreviewText} onChange={(v) => onUpdateMeta({ previewText: v })} placeholder="Shown in inbox preview" />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <div className="flex flex-wrap gap-1">
              {['general', 'welcome', 'invoice', 'project', 'lead', 'notification'].map((cat) => (
                <button key={cat} onClick={() => onUpdateMeta({ category: cat })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    templateCategory === cat ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-4">
          <div>
            <FieldLabel>Email Width</FieldLabel>
            <TextInput value={String(s.width || 600)} onChange={(v) => { const n = parseInt(v); if (n > 0) onUpdateSettings({ width: n }); }} />
          </div>
          <div>
            <FieldLabel>Outer Background</FieldLabel>
            <ColorInput value={s.outerBackground || '#f1f5f9'} onChange={(v) => onUpdateSettings({ outerBackground: v })} />
          </div>
          <div>
            <FieldLabel>Content Background</FieldLabel>
            <ColorInput value={s.contentBackground || '#ffffff'} onChange={(v) => onUpdateSettings({ contentBackground: v })} />
          </div>
          <div>
            <FieldLabel>Default Font</FieldLabel>
            <TextInput value={s.defaultFont || 'Arial, sans-serif'} onChange={(v) => onUpdateSettings({ defaultFont: v })} />
          </div>
          <div>
            <FieldLabel>Default Text Color</FieldLabel>
            <ColorInput value={s.defaultTextColor || '#1e293b'} onChange={(v) => onUpdateSettings({ defaultTextColor: v })} />
          </div>
          <div>
            <FieldLabel>Default Link Color</FieldLabel>
            <ColorInput value={s.defaultLinkColor || '#06B6D4'} onChange={(v) => onUpdateSettings({ defaultLinkColor: v })} />
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div>
            <FieldLabel>Default Spacing</FieldLabel>
            <TextInput value={String(s.defaultSpacing || 16)} onChange={(v) => { const n = parseInt(v); if (n > 0) onUpdateSettings({ defaultSpacing: n }); }} />
          </div>
          <div>
            <FieldLabel>Mobile Breakpoint</FieldLabel>
            <TextInput value={String(s.mobileBreakpoint || 480)} onChange={(v) => { const n = parseInt(v); if (n > 0) onUpdateSettings({ mobileBreakpoint: n }); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function MergeTagButton({ onInsert }: { onInsert: (tag: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 cursor-pointer whitespace-nowrap">
        <Tag className="w-3 h-3" />
        Merge Tags
      </button>
      {open && (
        <div className="absolute right-0 top-6 w-48 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="max-h-48 overflow-y-auto p-1">
            {MERGE_TAGS.map((mt) => (
              <button
                key={mt.tag}
                onClick={() => { onInsert(mt.tag); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  mt.supported ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-600 cursor-not-allowed'
                }`}
                disabled={!mt.supported}
              >
                <span className="font-mono text-purple-400">{`{{${mt.tag}}}`}</span>
                <span className="ml-2 text-slate-500">{mt.label}</span>
                {!mt.supported && <span className="text-[9px] text-slate-700 ml-1">— Not yet</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}