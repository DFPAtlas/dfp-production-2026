'use client';

import { motion } from '@/components/motion';
import { CheckCircle2, Circle, FlaskConical } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
}

interface PBXSetupChecklistProps {
  items: ChecklistItem[];
  comingSoon?: boolean;
}

export default function PBXSetupChecklist({ items, comingSoon }: PBXSetupChecklistProps) {
  const completed = items.filter(i => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Setup Checklist</h3>
        <span className="text-xs font-medium text-[#06B6D4]">{completed}/{total} complete</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#22D3EE]"
        />
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-1.5">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 shrink-0" />
            )}
            <span className={`text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
              {item.label}
            </span>
            {!item.done && item.href && (
              <a href={item.href} className="ml-auto text-xs text-[#06B6D4] hover:underline whitespace-nowrap cursor-pointer">Set up →</a>
            )}
          </div>
        ))}
      </div>
      {comingSoon && (
        <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2 text-[10px] text-[#3B82F6]">
          <FlaskConical className="w-3 h-3 shrink-0" />
          Some checklist items reference features in active testing and may use demo data
        </div>
      )}
    </div>
  );
}