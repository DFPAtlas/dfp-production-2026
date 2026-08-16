import type { Perspective } from '../lib/types';

interface PerspectiveSwitcherProps {
  perspective: Perspective;
  onChange: (p: Perspective) => void;
}

export default function PerspectiveSwitcher({ perspective, onChange }: PerspectiveSwitcherProps) {
  return (
    <div id="perspective-switcher" className="flex items-center justify-center border-b border-white/[0.05] bg-[#0a101c] py-2">
      <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => onChange('client')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            perspective === 'client'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="ri-user-line text-sm"></i>
          Client
        </button>
        <button
          type="button"
          onClick={() => onChange('guard')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            perspective === 'guard'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="ri-shield-user-line text-sm"></i>
          Guard
        </button>
      </div>
      <span className="ml-3 text-[10px] text-slate-600 hidden sm:inline">
        Experience as
      </span>
    </div>
  );
}