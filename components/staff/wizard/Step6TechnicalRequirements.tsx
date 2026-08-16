'use client';

import { AlertCircle } from 'lucide-react';
import type { WizardData, ValidationError } from '@/lib/wizard-types';

interface Step6Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  validationErrors: ValidationError[];
}

export default function Step6TechnicalRequirements({ data, onChange, validationErrors }: Step6Props) {
  const update = (field: keyof WizardData, value: string | boolean) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Technical Requirements</h2>
        <p className="text-sm text-slate-400 mt-1">Specify the technical landscape and infrastructure needs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldInput label="Platform / Current Stack" value={data.platformStack} onChange={(v) => update('platformStack', v)} placeholder="WordPress, React, custom, etc." />
        <FieldInput label="Hosting Provider" value={data.hostingProvider} onChange={(v) => update('hostingProvider', v)} placeholder="Vercel, AWS, Google Cloud, self-managed..." />
        <FieldInput label="Domain Name" value={data.domainName} onChange={(v) => update('domainName', v)} placeholder="example.com" />
        <FieldInput label="Email Provider" value={data.emailProvider} onChange={(v) => update('emailProvider', v)} placeholder="Google Workspace, Microsoft 365, Resend..." />
        <FieldInput label="Database Type" value={data.databaseType} onChange={(v) => update('databaseType', v)} placeholder="PostgreSQL, MySQL, MongoDB..." />
        <FieldInput label="Existing Integrations" value={data.existingIntegrations} onChange={(v) => update('existingIntegrations', v)} placeholder="CRM, ERP, payment gateways..." />
      </div>

      <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/15 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <p className="text-xs text-[#F59E0B]">
            Never enter passwords, API keys, or private credentials in project fields. These will be collected separately through a secure process during implementation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'User Authentication', key: 'authRequired' as const },
          { label: 'Data Migration', key: 'migrationRequired' as const },
          { label: 'WCAG Accessibility', key: 'accessibilityWCAG' as const },
          { label: 'Analytics & Tracking', key: 'analyticsRequired' as const },
        ].map(item => (
          <button key={item.key} onClick={() => update(item.key, !data[item.key])}
            className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer text-center ${
              data[item.key] ? 'bg-[#06B6D4]/5 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Compliance Requirements</label>
          <textarea
            value={data.complianceNotes}
            onChange={(e) => update('complianceNotes', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
            placeholder="GDPR, ISO 27001, SOC2, PCI DSS..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Security Requirements</label>
          <textarea
            value={data.securityNotes}
            onChange={(e) => update('securityNotes', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
            placeholder="SSL, 2FA, encryption, backup strategy..."
          />
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}