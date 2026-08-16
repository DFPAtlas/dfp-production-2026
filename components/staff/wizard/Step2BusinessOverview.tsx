'use client';

import type { WizardData, ValidationError } from '@/lib/wizard-types';

interface Step2Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  validationErrors: ValidationError[];
}

const fields = [
  { key: 'businessOverview' as const, label: 'What does the business do?', placeholder: 'Describe the core business activities, products, or services...', rows: 4 },
  { key: 'targetCustomers' as const, label: 'Who are their target customers?', placeholder: 'Describe the ideal customer demographics, industries, or segments...', rows: 3 },
  { key: 'problemStatement' as const, label: 'What problem are they trying to solve?', placeholder: 'What challenge or opportunity prompted this project?', rows: 3 },
  { key: 'currentSystems' as const, label: 'What systems or tools do they currently use?', placeholder: 'Existing software, platforms, or manual processes...', rows: 3 },
  { key: 'painPoints' as const, label: 'What are their current pain points?', placeholder: 'What frustrates them about their current situation?', rows: 3 },
];

export default function Step2BusinessOverview({ data, onChange, validationErrors }: Step2Props) {
  const update = (field: keyof WizardData, value: string) => onChange({ ...data, [field]: value });
  const getError = (field: string) => validationErrors.find(e => e.field === field)?.message;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Business Overview</h2>
        <p className="text-sm text-slate-400 mt-1">Help us understand the client&apos;s business context and challenges.</p>
      </div>

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
            <textarea
              value={data[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              rows={f.rows}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all resize-none ${
                getError(f.key) ? 'border-[#EF4444]/50 focus:border-[#EF4444] focus:ring-[#EF4444]/15' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
              }`}
              placeholder={f.placeholder}
            />
            {getError(f.key) && <p className="text-[10px] text-[#EF4444] mt-1">{getError(f.key)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}