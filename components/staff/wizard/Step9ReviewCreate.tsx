'use client';

import { Edit3, Building2, Target, Wrench, ListChecks, Cpu, PoundSterling, Lightbulb, Calendar, CheckCircle, User } from 'lucide-react';
import type { WizardData, ClientInfo, StaffInfo, ValidationError } from '@/lib/wizard-types';
import { SERVICE_OPTIONS, BUDGET_RANGE_OPTIONS, PRIORITY_OPTIONS } from '@/lib/wizard-types';

interface Step9Props {
  data: WizardData;
  clients: ClientInfo[];
  staff: StaffInfo[];
  validationErrors: ValidationError[];
  onEditStep: (step: number) => void;
  creating: boolean;
  onCreateProject: () => void;
  creationError: string | null;
}

export default function Step9ReviewCreate({
  data, clients, staff, validationErrors, onEditStep, creating, onCreateProject, creationError,
}: Step9Props) {
  const selectedClient = clients.find(c => c.id === data.existingClientId);
  const selectedLead = staff.find(s => s.id === data.projectLead);
  const budgetRange = BUDGET_RANGE_OPTIONS.find(r => r.value === data.budgetRangeLabel);
  const priorityLabel = PRIORITY_OPTIONS.find(p => p.value === data.priorityLevel)?.label || 'Medium';
  const serviceLabels = SERVICE_OPTIONS.filter(s => data.services.includes(s.value));

  const sectionClass = "bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-5";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Review &amp; Create</h2>
        <p className="text-sm text-slate-400 mt-1">Check everything is correct before creating the project.</p>
      </div>

      {creationError && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
          <p className="text-xs text-[#EF4444] font-medium mb-1">Creation failed</p>
          <p className="text-xs text-[#EF4444]/80">{creationError}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <p className="text-xs text-[#F59E0B] font-medium mb-1">Some fields need attention</p>
          <ul className="space-y-0.5">
            {validationErrors.map((e, i) => (
              <li key={i} className="text-[11px] text-[#F59E0B]/80">{e.message}</li>
            ))}
          </ul>
        </div>
      )}

      <ReviewSection step={1} title="Client Details" onEdit={() => onEditStep(1)}>
        {data.clientMode === 'existing' && selectedClient ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{selectedClient.company_name || 'Unnamed'}</p>
            <p className="text-xs text-slate-400">{selectedClient.contact_name}</p>
            {selectedClient.email && <p className="text-xs text-slate-400">{selectedClient.email}</p>}
            <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[10px] text-[#06B6D4] font-medium">Existing Client</span>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{data.newClient.company_name || 'Unnamed'}</p>
            <p className="text-xs text-slate-400">{data.newClient.contact_name}{data.newClient.email ? ` · ${data.newClient.email}` : ''}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-[#8B5CF6]/10 text-[10px] text-[#8B5CF6] font-medium">New Client</span>
          </div>
        )}
      </ReviewSection>

      <ReviewSection step={2} title="Business Overview" onEdit={() => onEditStep(2)}>
        {data.businessOverview ? (
          <p className="text-xs text-slate-300 line-clamp-3">{data.businessOverview}</p>
        ) : <p className="text-xs text-slate-500">No overview provided</p>}
      </ReviewSection>

      <ReviewSection step={3} title="Services Required" onEdit={() => onEditStep(3)}>
        {serviceLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {serviceLabels.map(s => (
              <span key={s.value} className="px-2 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded-lg text-[10px] font-medium">{s.label}</span>
            ))}
          </div>
        ) : <p className="text-xs text-[#EF4444]">No services selected</p>}
      </ReviewSection>

      <ReviewSection step={4} title="Project Goals" onEdit={() => onEditStep(4)}>
        {data.primaryGoal ? (
          <p className="text-xs text-slate-300 line-clamp-2">{data.primaryGoal}</p>
        ) : <p className="text-xs text-[#EF4444]">No primary goal set</p>}
      </ReviewSection>

      <ReviewSection step={5} title="Project Scope" onEdit={() => onEditStep(5)}>
        {data.deliverables.filter(d => d.trim()).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.deliverables.filter(d => d.trim()).slice(0, 6).map((d, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-300 rounded-lg text-[10px]">{d}</span>
            ))}
            {data.deliverables.filter(d => d.trim()).length > 6 && (
              <span className="px-2 py-0.5 bg-white/5 text-slate-400 rounded-lg text-[10px]">+{data.deliverables.filter(d => d.trim()).length - 6} more</span>
            )}
          </div>
        ) : <p className="text-xs text-slate-500">No deliverables specified</p>}
      </ReviewSection>

      <ReviewSection step={6} title="Technical Requirements" onEdit={() => onEditStep(6)}>
        {data.platformStack || data.hostingProvider || data.domainName ? (
          <div className="flex flex-wrap gap-1.5">
            {data.platformStack && <span className="px-2 py-0.5 bg-white/5 text-slate-300 rounded-lg text-[10px]">{data.platformStack}</span>}
            {data.hostingProvider && <span className="px-2 py-0.5 bg-white/5 text-slate-300 rounded-lg text-[10px]">{data.hostingProvider}</span>}
            {data.domainName && <span className="px-2 py-0.5 bg-white/5 text-slate-300 rounded-lg text-[10px]">{data.domainName}</span>}
            {data.authRequired && <span className="px-2 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded-lg text-[10px]">Auth</span>}
          </div>
        ) : <p className="text-xs text-slate-500">No technical details provided</p>}
      </ReviewSection>

      <ReviewSection step={7} title="Budget &amp; Timeline" onEdit={() => onEditStep(7)}>
        <div className="space-y-1">
          <p className="text-xs font-medium text-white">{data.projectName || 'Unnamed Project'}</p>
          <p className="text-xs text-slate-400">
            {budgetRange ? budgetRange.label : 'Budget not set'}
            {data.budgetAmount ? ` · £${parseInt(data.budgetAmount).toLocaleString()}` : ''}
          </p>
          <p className="text-xs text-slate-400">
            {data.targetStart ? new Date(data.targetStart + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No start date'}
            {' → '}
            {data.targetLaunch ? new Date(data.targetLaunch + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No launch date'}
          </p>
          <p className="text-xs text-slate-500">{priorityLabel} priority · {data.paymentPlan || 'No payment plan'}</p>
          {selectedLead && <p className="text-xs text-slate-400">Lead: {selectedLead.full_name}</p>}
        </div>
      </ReviewSection>

      <ReviewSection step={8} title="Roadmap Opportunities" onEdit={() => onEditStep(8)}>
        {data.roadmapItems.filter(i => i.title.trim()).length > 0 ? (
          <div className="space-y-1.5">
            {data.roadmapItems.filter(i => i.title.trim()).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="px-1.5 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded text-[10px] font-medium capitalize">{item.category}</span>
                <span className="text-slate-300">{item.title}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-slate-500">No roadmap items</p>}
      </ReviewSection>

      <div className={sectionClass}>
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-3">What will be created</p>
        <div className="space-y-2">
          <CheckItem done={true} label="Client record" detail={data.clientMode === 'new' ? `${data.newClient.company_name || 'New Client'} (created)` : `${selectedClient?.company_name || 'Existing'} (linked)`} />
          <CheckItem done={true} label="Project record" detail={data.projectName || 'Unnamed'} />
          <CheckItem done={true} label="Project access" detail="Creator gets full access" />
          <CheckItem done={true} label="Discovery data" detail="All 9 wizard steps saved" />
          <CheckItem done={true} label="Requirements" detail="Scope, integrations, user roles" />
          <CheckItem done={true} label="Activity log" detail="Project creation recorded" />
          <CheckItem done={data.roadmapItems.filter(i => i.title.trim()).length > 0} label="Roadmap items" detail={data.roadmapItems.filter(i => i.title.trim()).length > 0 ? `${data.roadmapItems.filter(i => i.title.trim()).length} opportunities` : 'None'} />
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onCreateProject}
          disabled={creating}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating project...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Create Project
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ReviewSection({ step, title, children, onEdit }: {
  step: number; title: string; children: React.ReactNode; onEdit: () => void;
}) {
  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">{step}</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
        </div>
        <button onClick={onEdit}
          className="flex items-center gap-1 text-[10px] text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer shrink-0">
          <Edit3 className="w-3 h-3" /> Edit
        </button>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function CheckItem({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${done ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-slate-500'}`}>
        <CheckCircle className="w-3 h-3" />
      </div>
      <div>
        <p className={`text-xs font-medium ${done ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
        <p className="text-[10px] text-slate-500">{detail}</p>
      </div>
    </div>
  );
}