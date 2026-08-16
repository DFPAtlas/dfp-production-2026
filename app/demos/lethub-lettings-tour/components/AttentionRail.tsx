'use client';

import { useState } from 'react';
import type { AttentionItem } from '../lib/types';

interface Props {
  items: AttentionItem[];
  onItemClick: (item: AttentionItem) => void;
}

export default function AttentionRail({ items, onItemClick }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const priorityDot = (p: string) => {
    if (p === 'High') return 'bg-red-400';
    if (p === 'Medium') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const priorityLabel = (p: string) => {
    if (p === 'High') return 'text-red-600 bg-red-50';
    if (p === 'Medium') return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="hidden w-72 shrink-0 flex-col border-l border-[#e8e5df] bg-white xl:flex">
      <div className="flex items-center justify-between border-b border-[#e8e5df] px-4 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1a2332]">Needs Your Attention</h3>
        <button onClick={() => setCollapsed(!collapsed)} className="text-[#8a8a8a] hover:text-[#1a2332] cursor-pointer">
          <i className={`${collapsed ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'} text-sm`} />
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 space-y-2 p-3">
          {items.length === 0 && (
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-4 text-center">
              <i className="ri-check-line text-lg text-emerald-500 mb-1 block" />
              <p className="text-xs text-[#8a8a8a]">Nothing needs attention</p>
            </div>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3 text-left transition hover:border-[#0d9488]/30 hover:bg-[#f0eeea] cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`h-2 w-2 rounded-full ${priorityDot(item.priority)}`} />
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${priorityLabel(item.priority)}`}>
                  {item.type}
                </span>
              </div>
              <p className="text-xs font-medium text-[#1a2332]">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{item.property}</p>
              <p className="mt-1 text-[10px] text-[#8a8a8a]">{item.detail}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}