'use client';

import { Plus, X, Check } from 'lucide-react';
import type { WizardData, ValidationError } from '@/lib/wizard-types';

interface Step5Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  validationErrors: ValidationError[];
}

export default function Step5ProjectScope({ data, onChange, validationErrors }: Step5Props) {
  const updateDeliverable = (idx: number, value: string) => {
    const deliverables = [...data.deliverables];
    deliverables[idx] = value;
    onChange({ ...data, deliverables });
  };
  const addDeliverable = () => onChange({ ...data, deliverables: [...data.deliverables, ''] });
  const removeDeliverable = (idx: number) => {
    if (data.deliverables.length <= 1) return;
    onChange({ ...data, deliverables: data.deliverables.filter((_, i) => i !== idx) });
  };

  const updateContent = (idx: number, value: string) => {
    const contentNeeds = [...data.contentNeeds];
    contentNeeds[idx] = value;
    onChange({ ...data, contentNeeds });
  };
  const addContent = () => onChange({ ...data, contentNeeds: [...data.contentNeeds, ''] });
  const removeContent = (idx: number) => {
    if (data.contentNeeds.length <= 1) return;
    onChange({ ...data, contentNeeds: data.contentNeeds.filter((_, i) => i !== idx) });
  };

  const updateIntegration = (idx: number, value: string) => {
    const integrationsList = [...data.integrationsList];
    integrationsList[idx] = value;
    onChange({ ...data, integrationsList });
  };
  const addIntegration = () => onChange({ ...data, integrationsList: [...data.integrationsList, ''] });
  const removeIntegration = (idx: number) => {
    if (data.integrationsList.length <= 1) return;
    onChange({ ...data, integrationsList: data.integrationsList.filter((_, i) => i !== idx) });
  };

  const updateExclusion = (idx: number, value: string) => {
    const exclusions = [...data.exclusions];
    exclusions[idx] = value;
    onChange({ ...data, exclusions });
  };
  const addExclusion = () => onChange({ ...data, exclusions: [...data.exclusions, ''] });
  const removeExclusion = (idx: number) => {
    if (data.exclusions.length <= 1) return;
    onChange({ ...data, exclusions: data.exclusions.filter((_, i) => i !== idx) });
  };

  const updateUserRole = (idx: number, value: string) => {
    const userRolesList = [...data.userRolesList];
    userRolesList[idx] = value;
    onChange({ ...data, userRolesList });
  };
  const addUserRole = () => onChange({ ...data, userRolesList: [...data.userRolesList, ''] });
  const removeUserRole = (idx: number) => {
    if (data.userRolesList.length <= 1) return;
    onChange({ ...data, userRolesList: data.userRolesList.filter((_, i) => i !== idx) });
  };

  const getError = (field: string) => validationErrors.find(e => e.field === field)?.message;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Project Scope</h2>
        <p className="text-sm text-slate-400 mt-1">Define what will and won&apos;t be delivered.</p>
      </div>

      <ChipSection label="Core Deliverables" items={data.deliverables} onUpdate={updateDeliverable} onAdd={addDeliverable} onRemove={removeDeliverable} placeholder="E.g. Responsive website with 10 pages" error={getError('deliverables')} />

      <ChipSection label="Content Needs" items={data.contentNeeds} onUpdate={updateContent} onAdd={addContent} onRemove={removeContent} placeholder="E.g. Copywriting for all pages" />

      <ChipSection label="Integrations & APIs" items={data.integrationsList} onUpdate={updateIntegration} onAdd={addIntegration} onRemove={removeIntegration} placeholder="E.g. Stripe payment gateway" />

      <ChipSection label="Out of Scope (Exclusions)" items={data.exclusions} onUpdate={updateExclusion} onAdd={addExclusion} onRemove={removeExclusion} placeholder="E.g. Mobile app development" />

      <ChipSection label="User Roles & Permissions" items={data.userRolesList} onUpdate={updateUserRole} onAdd={addUserRole} onRemove={removeUserRole} placeholder="E.g. Admin, Manager, Customer" />

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Dependencies & Assumptions</label>
        <textarea
          value={data.dependencies}
          onChange={(e) => onChange({ ...data, dependencies: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
          placeholder="What does this project depend on? Client inputs, third-party services, etc."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional Scope Notes</label>
        <textarea
          value={data.scopeNotes}
          onChange={(e) => onChange({ ...data, scopeNotes: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
          placeholder="Any other scope-related details..."
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Admin Dashboard', key: 'adminDashboard' as const },
          { label: 'Client Portal', key: 'clientPortal' as const },
          { label: 'Payment System', key: 'paymentRequired' as const },
          { label: 'Email System', key: 'emailRequired' as const },
          { label: 'File Upload', key: 'fileUploadRequired' as const },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => onChange({ ...data, [item.key]: !data[item.key] })}
            className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
              data[item.key] ? 'bg-[#06B6D4]/5 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${data[item.key] ? 'bg-[#06B6D4] border-[#06B6D4]' : 'border-[rgba(255,255,255,0.2)]'}`}>
              {data[item.key] && <Check className="w-3 h-3 text-white" />}
            </div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipSection({ label, items, onUpdate, onAdd, onRemove, placeholder, error }: {
  label: string;
  items: string[];
  onUpdate: (idx: number, value: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(idx, e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
              placeholder={placeholder}
            />
            <button onClick={() => onRemove(idx)} disabled={items.length <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#EF4444] hover:bg-white/5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Remove">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={onAdd}
        className="mt-2 flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
        <Plus className="w-3.5 h-3.5" /> Add item
      </button>
      {error && <p className="text-[10px] text-[#EF4444] mt-1">{error}</p>}
    </div>
  );
}