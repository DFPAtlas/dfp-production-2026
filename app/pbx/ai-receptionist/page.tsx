'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { Bot, Shield } from 'lucide-react';

const guardrails = [
  'Cannot call arbitrary numbers',
  'Cannot change billing',
  'Cannot delete customer data',
  'Cannot expose recordings to unauthorised users',
  'Cannot bypass tenant permissions',
  'Cannot send unapproved SMS',
  'Cannot route to unapproved destinations',
];

export default function PBXAIReceptionistPage() {
  return (
    <PBXShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">AI Receptionist</h1>
          <p className="text-sm text-slate-400 mt-0.5">AI-powered virtual receptionist for your tenant</p>
        </div>

        <PBXEmptyState
          icon={<Bot className="w-7 h-7 text-slate-500" />}
          title="AI Receptionist is not yet active"
          description="The AI receptionist requires a configured AI provider and n8n workflows. Digital-Footprint enables this once your voice connection is live."
        />

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#EF4444]/10 flex items-center justify-center"><Shield className="w-4 h-4 text-[#EF4444]" /></div>
            <h3 className="text-sm font-semibold text-white">Safety Guardrails</h3>
          </div>
          <div className="space-y-2">
            {guardrails.map((g) => (
              <div key={g} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-5 h-5 flex items-center justify-center shrink-0"><i className="ri-close-circle-line text-[#EF4444] text-sm" /></div>
                {g}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            The AI receptionist is limited to authorised functions and never has unrestricted admin or database access.
          </p>
        </div>
      </div>
    </PBXShell>
  );
}