'use client';

import { Plus, X, Check } from 'lucide-react';
import type { WizardData, ValidationError } from '@/lib/wizard-types';

interface Step4Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  validationErrors: ValidationError[];
}

const strategicObjectives = [
  'Increase leads and sales',
  'Save time and reduce admin',
  'Automate manual workflows',
  'Improve customer service',
  'Improve cyber security',
  'Modernise legacy systems',
  'Launch a new digital platform',
  'Improve data and reporting',
  'Enable remote working',
  'Ensure regulatory compliance',
];

export default function Step4ProjectGoals({ data, onChange, validationErrors }: Step4Props) {
  const update = (field: keyof WizardData, value: string) => onChange({ ...data, [field]: value });

  const addOutcome = () => onChange({ ...data, measurableOutcomes: [...data.measurableOutcomes, ''] });
  const updateOutcome = (idx: number, value: string) => {
    const outcomes = [...data.measurableOutcomes];
    outcomes[idx] = value;
    onChange({ ...data, measurableOutcomes: outcomes });
  };
  const removeOutcome = (idx: number) => {
    if (data.measurableOutcomes.length <= 1) return;
    onChange({ ...data, measurableOutcomes: data.measurableOutcomes.filter((_, i) => i !== idx) });
  };

  const getError = (field: string) => validationErrors.find(e => e.field === field)?.message;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Project Goals</h2>
        <p className="text-sm text-slate-400 mt-1">Define what success looks like and what the project aims to achieve.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Primary Goal <span className="text-[#EF4444]">*</span>
          </label>
          <textarea
            value={data.primaryGoal}
            onChange={(e) => update('primaryGoal', e.target.value)}
            rows={2}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all resize-none ${
              getError('primaryGoal') ? 'border-[#EF4444]/50 focus:border-[#EF4444] focus:ring-[#EF4444]/15' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
            }`}
            placeholder="The single most important outcome this project must deliver..."
          />
          {getError('primaryGoal') && <p className="text-[10px] text-[#EF4444] mt-1">{getError('primaryGoal')}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">How will success be measured?</label>
          <textarea
            value={data.successDefinition}
            onChange={(e) => update('successDefinition', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
            placeholder="Specific metrics, KPIs, or observable outcomes that define success..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Measurable Outcomes</label>
          <div className="space-y-2">
            {data.measurableOutcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => updateOutcome(idx, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
                  placeholder={`Outcome ${idx + 1}, e.g. Reduce response time by 50%`}
                />
                <button
                  onClick={() => removeOutcome(idx)}
                  disabled={data.measurableOutcomes.length <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#EF4444] hover:bg-white/5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  title="Remove outcome"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addOutcome}
            className="mt-2 flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add outcome
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Strategic Objectives (select all that apply)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strategicObjectives.map((objective) => {
              const selected = data.measurableOutcomes.includes(objective);

              const toggleObjective = () => {
                const updated = selected
                  ? data.measurableOutcomes.filter(o => o !== objective)
                  : [...data.measurableOutcomes.filter(o => o.trim()), objective];
                onChange({ ...data, measurableOutcomes: updated });
              };

              return (
                <button key={objective} onClick={toggleObjective}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all cursor-pointer ${
                    selected ? 'bg-[#06B6D4]/5 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-[#06B6D4] border-[#06B6D4]' : 'border-[rgba(255,255,255,0.2)]'}`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {objective}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}