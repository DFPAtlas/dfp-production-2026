'use client';

import { Plus, X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import type { WizardData, ValidationError, RoadmapItemData } from '@/lib/wizard-types';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '@/lib/wizard-types';

interface Step8Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  validationErrors: ValidationError[];
}

let idCounter = 0;
function newId(): string {
  return `roadmap_${Date.now()}_${++idCounter}`;
}

export default function Step8RoadmapOpportunities({ data, onChange, validationErrors }: Step8Props) {
  const addItem = () => {
    onChange({
      ...data,
      roadmapItems: [...data.roadmapItems, {
        id: newId(),
        title: '',
        description: '',
        category: 'service',
        priority: 'medium',
      }],
    });
  };

  const updateItem = (id: string, field: keyof RoadmapItemData, value: string) => {
    onChange({
      ...data,
      roadmapItems: data.roadmapItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, roadmapItems: data.roadmapItems.filter(i => i.id !== id) });
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const idx = data.roadmapItems.findIndex(i => i.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= data.roadmapItems.length) return;
    const items = [...data.roadmapItems];
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    onChange({ ...data, roadmapItems: items });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Roadmap Opportunities</h2>
        <p className="text-sm text-slate-400 mt-1">These are future possibilities, not committed scope. Add ideas for later phases.</p>
      </div>

      {data.roadmapItems.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-[rgba(255,255,255,0.05)]">
          <p className="text-slate-400 text-sm">No roadmap items yet</p>
          <p className="text-xs text-slate-500 mt-1">Add future opportunities like AI features, automations, or integrations.</p>
          <button onClick={addItem}
            className="mt-3 px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4 inline mr-1.5" /> Add Opportunity
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.roadmapItems.map((item, idx) => (
            <div key={item.id}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                  <button onClick={() => moveItem(item.id, 'up')} disabled={idx === 0}
                    className="w-6 h-5 flex items-center justify-center rounded text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Move up">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveItem(item.id, 'down')} disabled={idx === data.roadmapItems.length - 1}
                    className="w-6 h-5 flex items-center justify-center rounded text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Move down">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
                      placeholder="Opportunity title, e.g. AI chatbot for support"
                    />
                    <button onClick={() => removeItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#EF4444] hover:bg-white/5 transition-all cursor-pointer shrink-0"
                      title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
                    placeholder="Brief description of this opportunity..."
                  />
                  <div className="flex gap-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      className="px-3 pr-7 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none cursor-pointer appearance-none"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c} className="bg-[#1E293B] capitalize">{c}</option>
                      ))}
                    </select>
                    <select
                      value={item.priority}
                      onChange={(e) => updateItem(item.id, 'priority', e.target.value)}
                      className="px-3 pr-7 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none cursor-pointer appearance-none"
                    >
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value} className="bg-[#1E293B]">{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add opportunity
          </button>
        </div>
      )}
    </div>
  );
}