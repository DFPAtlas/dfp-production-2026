'use client';

import { useState } from 'react';
import {
  Blocks, LayoutGrid, ListTree, ChevronLeft, ChevronRight,
  Type, Image, MousePointer, Minus, ArrowUpDown, Columns2, Columns3,
  Building2, Crown, Contact, Share2, MailCheck, PanelTop, PanelBottom,
  MailX, Monitor, GripHorizontal,
} from 'lucide-react';
import { BLOCK_DEFINITIONS, BLOCK_CATEGORIES, EditorSection, EditorBlockData, EditorDocument } from './editor-types';
import { createBlock } from './editor-utils';

const BLOCK_ICON_MAP: Record<string, React.ElementType> = {
  heading: Type, text: Type, image: Image, button: MousePointer, divider: Minus, spacer: ArrowUpDown,
  oneColumn: Columns2, twoColumns: Columns2, threeColumns: Columns3,
  logo: Building2, featureCard: Crown, contactDetails: Contact, socialLinks: Share2,
  preheader: MailCheck, header: PanelTop, footer: PanelBottom, unsubscribe: MailX, viewInBrowser: Monitor,
};

interface LeftPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  document: EditorDocument;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onAddBlock: (sectionId: string, block: EditorBlockData, afterBlockId?: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDeleteBlock: (blockId: string) => void;
  onAddSection: () => void;
}

export default function LeftPanel({
  collapsed, onToggle, document, selectedBlockId,
  onSelectBlock, onAddBlock, onMoveBlock, onDeleteBlock, onAddSection,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<'blocks' | 'sections' | 'structure'>('blocks');

  if (collapsed) {
    return (
      <div className="w-12 bg-[#0a0a0c] border-r border-[rgba(255,255,255,0.06)] flex flex-col items-center py-3 gap-1 shrink-0">
        <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white cursor-pointer" title="Expand panel">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => { setActiveTab('blocks'); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer" title="Blocks">
          <Blocks className="w-4 h-4" />
        </button>
        <button onClick={() => { setActiveTab('sections'); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer" title="Sections">
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button onClick={() => { setActiveTab('structure'); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer" title="Structure">
          <ListTree className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[260px] bg-[#0a0a0c] border-r border-[rgba(255,255,255,0.06)] flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'blocks' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocks
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'sections' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'structure' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Structure
          </button>
        </div>
        <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white cursor-pointer" title="Collapse">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'blocks' && (
          <div className="space-y-5">
            {BLOCK_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">{cat.name}</p>
                <div className="space-y-0.5">
                  {cat.blocks.map((blockType) => {
                    const def = BLOCK_DEFINITIONS[blockType];
                    const IconComp = BLOCK_ICON_MAP[blockType] || GripHorizontal;
                    return (
                      <button
                        key={blockType}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('blockType', blockType); }}
                        onClick={() => {
                          const lastSection = document.sections[document.sections.length - 1];
                          if (lastSection && lastSection.rows.length > 0) {
                            const lastRow = lastSection.rows[lastSection.rows.length - 1];
                            const lastCol = lastRow.columns[lastRow.columns.length - 1];
                            onAddBlock(lastSection.id, createBlock(blockType), lastCol.blocks.length > 0 ? lastCol.blocks[lastCol.blocks.length - 1].id : undefined);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-all cursor-pointer group"
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate">{def.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Saved Sections</p>
            <button
              onClick={() => {
                const sec = document.sections.find(s => s.label === 'Header');
                if (sec) {
                  const lastRow = sec.rows[sec.rows.length - 1];
                  if (lastRow) {
                    const lastCol = lastRow.columns[lastRow.columns.length - 1];
                    onAddBlock(sec.id, createBlock('header'), lastCol.blocks.length > 0 ? lastCol.blocks[lastCol.blocks.length - 1].id : undefined);
                  }
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <PanelTop className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium">DFP Header</p>
                <p className="text-[10px] text-slate-600">Standard email header</p>
              </div>
            </button>
            <button
              onClick={() => {
                const sec = document.sections.find(s => s.label === 'Footer');
                if (sec) {
                  const lastRow = sec.rows[sec.rows.length - 1];
                  if (lastRow) {
                    const lastCol = lastRow.columns[lastRow.columns.length - 1];
                    onAddBlock(sec.id, createBlock('footer'), lastCol.blocks.length > 0 ? lastCol.blocks[lastCol.blocks.length - 1].id : undefined);
                  }
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <PanelBottom className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium">Standard Footer</p>
                <p className="text-[10px] text-slate-600">Legal footer & unsubscribe</p>
              </div>
            </button>
            <button
              onClick={() => {
                const sec = document.sections.find(s => s.label === 'Content') || document.sections[document.sections.length - 1];
                if (sec) {
                  const lastRow = sec.rows[sec.rows.length - 1];
                  if (lastRow) {
                    const lastCol = lastRow.columns[lastRow.columns.length - 1];
                    onAddBlock(sec.id, createBlock('socialLinks'), lastCol.blocks.length > 0 ? lastCol.blocks[lastCol.blocks.length - 1].id : undefined);
                  }
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium">Social Links</p>
                <p className="text-[10px] text-slate-600">Facebook, Twitter, LinkedIn</p>
              </div>
            </button>
            <button
              onClick={() => {
                const sec = document.sections.find(s => s.label === 'Content') || document.sections[document.sections.length - 1];
                if (sec) {
                  const lastRow = sec.rows[sec.rows.length - 1];
                  if (lastRow) {
                    const lastCol = lastRow.columns[lastRow.columns.length - 1];
                    onAddBlock(sec.id, createBlock('contactDetails'), lastCol.blocks.length > 0 ? lastCol.blocks[lastCol.blocks.length - 1].id : undefined);
                  }
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Contact className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium">Contact Block</p>
                <p className="text-[10px] text-slate-600">Company contact details</p>
              </div>
            </button>
            <button
              onClick={() => {
                const sec = document.sections.find(s => s.label === 'Content') || document.sections[document.sections.length - 1];
                if (sec) {
                  const lastRow = sec.rows[sec.rows.length - 1];
                  if (lastRow) {
                    const lastCol = lastRow.columns[lastRow.columns.length - 1];
                    onAddBlock(sec.id, createBlock('featureCard'), lastCol.blocks.length > 0 ? lastCol.blocks[lastCol.blocks.length - 1].id : undefined);
                  }
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Crown className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium">CTA Section</p>
                <p className="text-[10px] text-slate-600">Call-to-action block</p>
              </div>
            </button>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Email Structure</p>
            {document.sections.map((section, si) => (
              <div key={section.id} className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-[rgba(255,255,255,0.04)] mb-1">
                  <ListTree className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-300 truncate">{section.label || `Section ${si + 1}`}</span>
                </div>
                {section.rows.map((row, ri) => (
                  <div key={row.id} className="ml-3 mb-0.5">
                    {row.columns.map((col, ci) => (
                      <div key={col.id} className="ml-3">
                        {col.blocks.map((block) => {
                          const isSelected = block.id === selectedBlockId;
                          return (
                            <button
                              key={block.id}
                              onClick={() => onSelectBlock(block.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all cursor-pointer group ${
                                isSelected ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                              }`}
                            >
                              {(() => {
                                const IconComp = BLOCK_ICON_MAP[block.type] || GripHorizontal;
                                return <IconComp className="w-3 h-3 shrink-0" />;
                              })()}
                              <span className="text-[11px] truncate flex-1">{BLOCK_DEFINITIONS[block.type]?.label || block.type}</span>
                              <span
                                onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-[10px] shrink-0"
                              >
                                &times;
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={onAddSection}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-dashed border-[rgba(255,255,255,0.08)] text-xs text-slate-500 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer"
            >
              + Add Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}