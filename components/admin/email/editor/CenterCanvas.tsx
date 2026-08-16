'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GripHorizontal, Trash2, Copy, ArrowUp, ArrowDown,
  Image, Type, MousePointer, Crown,
} from 'lucide-react';
import { EditorDocument, EditorBlockData, BLOCK_DEFINITIONS } from './editor-types';
import { renderBlockToInline } from './inline-renderer';

function getTextAlign(value: unknown): React.CSSProperties['textAlign'] {
  return value === 'left' || value === 'right' || value === 'center' || value === 'justify'
    ? value
    : 'left';
}

const BLOCK_ICON_MAP: Record<string, React.ElementType> = {
  heading: Type, text: Type, image: Image, button: MousePointer, divider: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12" /></svg>
  ),
  spacer: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="4" x2="12" y2="20" /><line x1="8" y1="8" x2="16" y2="8" /></svg>
  ),
  oneColumn: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /></svg>
  ),
  twoColumns: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="18" rx="1" /><rect x="13" y="3" width="8" height="18" rx="1" /></svg>
  ),
  threeColumns: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="5.5" height="18" rx="1" /><rect x="9" y="3" width="5.5" height="18" rx="1" /><rect x="16" y="3" width="5.5" height="18" rx="1" /></svg>
  ),
  logo: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
  ),
  featureCard: Crown, contactDetails: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /><circle cx="12" cy="8" r="2" /><path d="M7 21v-2a2 2 0 012-2h6a2 2 0 012 2v2" /></svg>
  ),
  socialLinks: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.7 13.7l6.6 3.3M15.3 5.3l-6.6 3.3" /></svg>
  ),
  header: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
  ),
  footer: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
  ),
  unsubscribe: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="1" /><line x1="3" y1="5" x2="21" y2="19" /></svg>
  ),
  viewInBrowser: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  preheader: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7" /><circle cx="16" cy="18" r="3" /><line x1="18" y1="16" x2="18" y2="20" /></svg>
  ),
};

interface CenterCanvasProps {
  document: EditorDocument;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (blockId: string, updates: { data?: Record<string, unknown>; style?: Record<string, unknown>; settings?: Record<string, unknown> }) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  inlineEditing: boolean;
  onInlineEdit: (blockId: string, text: string) => void;
}

export default function CenterCanvas({
  document, selectedBlockId, onSelectBlock, onUpdateBlock,
  onDeleteBlock, onDuplicateBlock, onMoveBlock,
  leftCollapsed, rightCollapsed, inlineEditing, onInlineEdit,
}: CenterCanvasProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBlockClick = useCallback((blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectBlock(blockId);

    if (inlineEditing) return;
    const block = findBlock(document, blockId);
    if (block && (block.type === 'heading' || block.type === 'text')) {
      setEditingBlockId(blockId);
      setEditText(block.data.text as string || '');
    } else {
      setEditingBlockId(null);
    }
  }, [document, onSelectBlock, inlineEditing]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest('.canvas-bg-area')) {
      onSelectBlock(null);
      setEditingBlockId(null);
    }
  }, [onSelectBlock]);

  const handleTextCommit = useCallback(() => {
    if (editingBlockId) {
      onInlineEdit(editingBlockId, editText);
    }
    setEditingBlockId(null);
  }, [editingBlockId, editText, onInlineEdit]);

  useEffect(() => {
    if (!inlineEditing) {
      setEditingBlockId(null);
    }
  }, [inlineEditing]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#1a1a1e]"
      onClick={handleCanvasClick}
    >
      <div
        className="canvas-bg-area min-h-full py-6 flex justify-center"
        style={{ backgroundColor: document.settings.outerBackground || '#f1f5f9' }}
      >
        <div
          className="bg-white shadow-lg min-h-[400px]"
          style={{
            width: `${document.settings.width || 600}px`,
            maxWidth: '100%',
            backgroundColor: document.settings.contentBackground || '#ffffff',
          }}
        >
          {document.sections.map((section) => (
            <div key={section.id}>
              {section.rows.map((row) => (
                <div key={row.id}>
                  {row.columns.map((col) => (
                    <div key={col.id} style={{ width: `${col.width}%`, display: 'inline-block', verticalAlign: 'top' }}>
                      {col.blocks.map((block, blockIdx) => {
                        const isSelected = selectedBlockId === block.id;
                        const isHovered = hoveredBlockId === block.id;
                        const isEditing = editingBlockId === block.id && !inlineEditing;

                        return (
                          <div
                            key={block.id}
                            data-block-id={block.id}
                            onClick={(e) => handleBlockClick(block.id, e)}
                            onMouseEnter={() => setHoveredBlockId(block.id)}
                            onMouseLeave={() => setHoveredBlockId(null)}
                            className={`relative group transition-all cursor-pointer ${
                              isSelected && !inlineEditing
                                ? 'ring-2 ring-[#06B6D4] ring-offset-1 z-10'
                                : isHovered && !inlineEditing
                                  ? 'ring-1 ring-[#06B6D4]/30 z-10'
                                  : 'ring-1 ring-transparent'
                            }`}
                            style={{ position: 'relative' }}
                          >
                            {!inlineEditing && (isSelected || isHovered) && (
                              <div className="absolute -top-2 -right-1 flex items-center gap-0.5 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-lg px-0.5 py-0.5 z-20 shadow-xl">
                                <span className="text-[9px] text-slate-400 px-1 uppercase">
                                  {BLOCK_DEFINITIONS[block.type]?.label || block.type}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 'up'); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/[0.1] cursor-pointer"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 'down'); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/[0.1] cursor-pointer"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDuplicateBlock(block.id); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/[0.1] cursor-pointer"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {isEditing ? (
                              <textarea
                                autoFocus
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleTextCommit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') { handleTextCommit(); }
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextCommit(); }
                                }}
                                className="w-full border-none outline-none resize-none"
                                style={{
                                  fontFamily: (block.style.fontFamily as string) || document.settings.defaultFont,
                                  fontSize: (block.style.fontSize as string) || '14px',
                                  fontWeight: (block.style.fontWeight as string) || 'normal',
                                  color: (block.style.color as string) || document.settings.defaultTextColor,
                                  textAlign: getTextAlign(block.style.textAlign),
                                  padding: (block.style.padding as string) || '8px 0',
                                  lineHeight: '1.6',
                                }}
                              />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{ __html: renderBlockToInline(block, document.settings, document.settings.defaultLinkColor) }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function findBlock(doc: EditorDocument, id: string): EditorBlockData | null {
  for (const section of doc.sections) {
    for (const row of section.rows) {
      for (const col of row.columns) {
        for (const block of col.blocks) {
          if (block.id === id) return block;
        }
      }
    }
  }
  return null;
}

export { findBlock };
