'use client';

import { Check } from 'lucide-react';
import type { WizardData, ValidationError } from '@/lib/wizard-types';
import { SERVICE_OPTIONS } from '@/lib/wizard-types';

interface Step3Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  validationErrors: ValidationError[];
}

export default function Step3ServicesRequired({ data, onChange, validationErrors }: Step3Props) {
  const toggleService = (value: string) => {
    const services = data.services.includes(value)
      ? data.services.filter(s => s !== value)
      : [...data.services, value];
    onChange({ ...data, services });
  };

  const fieldError = validationErrors.find(e => e.field === 'services')?.message;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Services Required</h2>
        <p className="text-sm text-slate-400 mt-1">Select all services the client is interested in. At least one is required.</p>
      </div>

      {fieldError && (
        <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs">{fieldError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICE_OPTIONS.map((opt) => {
          const selected = data.services.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleService(opt.value)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selected
                  ? 'bg-[#06B6D4]/5 border-[#06B6D4]/30'
                  : 'bg-white/5 border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                selected ? 'bg-[#06B6D4] border-[#06B6D4]' : 'border-[rgba(255,255,255,0.2)]'
              }`}>
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="min-w-0">
                <span className={`text-sm font-medium block ${selected ? 'text-[#06B6D4]' : 'text-slate-300'}`}>
                  <i className={`${opt.icon} w-4 h-4 mr-1.5 align-middle`}></i>
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">{opt.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}