'use client';

import type { WizardData, ValidationError, StaffInfo } from '@/lib/wizard-types';
import { BUDGET_RANGE_OPTIONS, PAYMENT_PLAN_OPTIONS, PRIORITY_OPTIONS } from '@/lib/wizard-types';
import { Search, User } from 'lucide-react';

interface Step7Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  staff: StaffInfo[];
  validationErrors: ValidationError[];
}

export default function Step7BudgetTimeline({ data, onChange, staff, validationErrors }: Step7Props) {
  const update = (field: keyof WizardData, value: string) => onChange({ ...data, [field]: value });

  const getError = (field: string) => validationErrors.find(e => e.field === field)?.message;

  const handleBudgetRange = (value: string) => {
    const range = BUDGET_RANGE_OPTIONS.find(r => r.value === value);
    onChange({
      ...data,
      budgetRangeLabel: value,
      budgetAmount: range ? String(range.min) : '',
    });
  };

  const suggestProjectName = () => {
    if (data.projectName) return;
    const clientName = data.newClient.company_name || 'New Project';
    const firstService = data.services.length > 0
      ? data.services[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Project';
    onChange({ ...data, projectName: `${clientName} — ${firstService}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Budget &amp; Timeline</h2>
        <p className="text-sm text-slate-400 mt-1">Define the investment, schedule, and project identity.</p>
      </div>

      <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/15 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Budget Range</label>
            <select
              value={data.budgetRangeLabel}
              onChange={(e) => handleBudgetRange(e.target.value)}
              className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all cursor-pointer appearance-none"
            >
              <option value="">Select range</option>
              {BUDGET_RANGE_OPTIONS.map(r => (
                <option key={r.value} value={r.value} className="bg-[#1E293B]">{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Approximate Budget (GBP)</label>
            <input
              type="number"
              value={data.budgetAmount}
              onChange={(e) => update('budgetAmount', e.target.value)}
              min="0"
              step="100"
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${
                getError('budgetAmount') ? 'border-[#EF4444]/50' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
              }`}
              placeholder="Enter numeric amount in GBP"
            />
            {getError('budgetAmount') && <p className="text-[10px] text-[#EF4444] mt-1">{getError('budgetAmount')}</p>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Plan</label>
        <select
          value={data.paymentPlan}
          onChange={(e) => update('paymentPlan', e.target.value)}
          className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all cursor-pointer appearance-none"
        >
          <option value="">Select plan</option>
          {PAYMENT_PLAN_OPTIONS.map(p => (
            <option key={p} value={p} className="bg-[#1E293B]">{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Target Start Date <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="date"
            value={data.targetStart}
            onChange={(e) => update('targetStart', e.target.value)}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${
              getError('targetStart') ? 'border-[#EF4444]/50' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
            }`}
          />
          {getError('targetStart') && <p className="text-[10px] text-[#EF4444] mt-1">{getError('targetStart')}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Target Launch Date <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="date"
            value={data.targetLaunch}
            onChange={(e) => update('targetLaunch', e.target.value)}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${
              getError('targetLaunch') ? 'border-[#EF4444]/50' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
            }`}
          />
          {getError('targetLaunch') && <p className="text-[10px] text-[#EF4444] mt-1">{getError('targetLaunch')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority Level</label>
        <select
          value={data.priorityLevel}
          onChange={(e) => update('priorityLevel', e.target.value)}
          className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all cursor-pointer appearance-none"
        >
          {PRIORITY_OPTIONS.map(p => (
            <option key={p.value} value={p.value} className="bg-[#1E293B]">{p.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-400">
              Project Name <span className="text-[#EF4444]">*</span>
            </label>
            <button onClick={suggestProjectName}
              className="text-[10px] text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
              Suggest name
            </button>
          </div>
          <input
            type="text"
            value={data.projectName}
            onChange={(e) => update('projectName', e.target.value)}
            className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${
              getError('projectName') ? 'border-[#EF4444]/50' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
            }`}
            placeholder="E.g. Acme Corp — Website Redesign"
          />
          {getError('projectName') && <p className="text-[10px] text-[#EF4444] mt-1">{getError('projectName')}</p>}
        </div>

        {staff.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Lead</label>
            <select
              value={data.projectLead}
              onChange={(e) => update('projectLead', e.target.value)}
              className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all cursor-pointer appearance-none"
            >
              <option value="">Unassigned</option>
              {staff.map(s => (
                <option key={s.id} value={s.id} className="bg-[#1E293B]">
                  {s.full_name || 'Unknown'} {s.role ? `(${s.role.replace(/_/g, ' ')})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Description Summary</label>
          <textarea
            value={data.descriptionSummary}
            onChange={(e) => update('descriptionSummary', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
            placeholder="A brief one-paragraph summary for the project record..."
          />
        </div>
      </div>
    </div>
  );
}