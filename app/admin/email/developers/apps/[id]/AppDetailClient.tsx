'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Shield, Key, Webhook, Activity, Clock, CheckCircle2, XCircle, AlertTriangle, Pause, Ban, Archive, FileText, Copy, RefreshCw, Edit, Plus } from 'lucide-react';

const APP_DETAILS: Record<string, any> = {
  '1': { name: 'GuardianHub API', description: 'Core API for GuardianHub product — template rendering, campaign scheduling, contact sync and delivery analytics.', app_type: 'dfp_product', environment: 'production', status: 'active', technical_owner: 'devops@digitalfootprint.uk', support_contact: 'support@digitalfootprint.uk', product_or_brand: 'GuardianHub', required_scopes: ['templates.read','campaigns.create_draft','campaigns.schedule','contacts.read_masked','analytics.delivery.read'], allowed_webhook_events: ['email.delivered','email.bounced','campaign.completed'], review_notes: 'Approved with standard DFP product scopes. Schedule scope requires additional review.', created_at: '2026-03-15T10:00:00Z', updated_at: '2026-06-20T14:00:00Z', keys: [{ id: 'k1', prefix: 'dfp_gapi_prod_', status: 'active', scopes: ['templates.read','campaigns.create_draft'], created: '2026-03-15' },{ id: 'k2', prefix: 'dfp_gapi_prod_sch_', status: 'active', scopes: ['campaigns.schedule'], created: '2026-04-01' }], webhooks: [{ id: 'w1', url: 'https://api.guardianhub.io/webhooks/email', status: 'active', events: ['email.delivered','email.bounced'], retries: 'standard' }] },
  '2': { name: 'GuardianHub API Sandbox', description: 'Sandbox version for development and testing environments.', app_type: 'dfp_product', environment: 'sandbox', status: 'active', technical_owner: 'devops@digitalfootprint.uk', support_contact: 'support@digitalfootprint.uk', product_or_brand: 'GuardianHub', required_scopes: ['templates.read','contacts.read_masked','sandbox.*'], allowed_webhook_events: ['email.delivered'], review_notes: 'Sandbox — no production access.', created_at: '2026-03-15T10:30:00Z', updated_at: '2026-06-18T09:00:00Z', keys: [{ id: 'k3', prefix: 'dfp_gapi_sand_', status: 'active', scopes: ['templates.read','sandbox.*'], created: '2026-03-15' }], webhooks: [] },
};

export default function AppDetailClient({ id }: { id: string }) {
  const app = APP_DETAILS[id];
  const [activeTab, setActiveTab] = useState<'overview'|'keys'|'webhooks'>('overview');

  if (!app) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-white text-lg font-semibold">Application not found</p>
        <Link href="/admin/email/developers/apps" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Back to applications</Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    draft: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    pending_review: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    suspended: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    revoked: 'text-red-400 bg-red-400/10 border-red-400/20',
    archived: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  };
  const statusIcons: Record<string, React.ElementType> = {
    active: CheckCircle2, draft: Clock, pending_review: Clock,
    suspended: Pause, revoked: Ban, archived: Archive,
  };
  const StatusIcon = statusIcons[app.status] || Clock;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <Link href="/admin/email/developers" className="hover:text-white transition-colors cursor-pointer">Developers</Link>
        <span>/</span>
        <Link href="/admin/email/developers/apps" className="hover:text-white transition-colors cursor-pointer">Applications</Link>
        <span>/</span>
        <span className="text-slate-300">{app.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{app.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase ${statusColors[app.status]}`}>
                <StatusIcon className="w-3 h-3" /> {app.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">{app.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-semibold hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Globe, label: 'Environment', value: app.environment },
          { icon: Shield, label: 'Scopes', value: `${(app.required_scopes || []).length} granted` },
          { icon: Key, label: 'Active Keys', value: (app.keys || []).filter((k: any) => k.status === 'active').length },
          { icon: Webhook, label: 'Webhooks', value: (app.webhooks || []).length },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-white capitalize">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-1">
        {(['overview','keys','webhooks'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === tab ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'overview' ? 'Overview' : tab === 'keys' ? 'Integration Keys' : 'Webhooks'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">Application Details</h2>
            <dl className="space-y-3">
              {[
                { label: 'Type', value: app.app_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
                { label: 'Product / Brand', value: app.product_or_brand },
                { label: 'Environment', value: app.environment },
                { label: 'Technical Owner', value: app.technical_owner },
                { label: 'Support Contact', value: app.support_contact },
                { label: 'Created', value: new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="text-xs text-slate-300 text-right">{item.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">Granted Scopes</h2>
            <div className="space-y-2">
              {(app.required_scopes || []).map((scope: string) => {
                const isHighRisk = scope.includes('schedule') || scope.includes('send') || scope.includes('preferences') || scope.includes('manage');
                return (
                  <div key={scope} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${isHighRisk ? 'bg-red-400/[0.03] border-red-400/[0.1]' : 'bg-white/[0.02] border-[rgba(255,255,255,0.04)]'}`}>
                    <Shield className={`w-4 h-4 shrink-0 ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`} />
                    <code className="text-xs text-slate-300 font-mono flex-1">{scope}</code>
                    {isHighRisk && <span className="text-[10px] text-red-400 font-medium uppercase">High Risk</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {app.review_notes && (
            <div className="lg:col-span-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-2">Review Notes</h2>
              <p className="text-xs text-slate-400">{app.review_notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-bold text-white">Integration Keys</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 rounded-lg text-xs font-semibold hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
              <Plus className="w-3 h-3" /> Generate Key
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Key Prefix</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Scopes</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {(app.keys || []).map((key: any) => (
                  <tr key={key.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        <code className="text-xs text-slate-300 font-mono">{key.prefix}••••••••</code>
                        <button className="text-slate-600 hover:text-slate-400 cursor-pointer"><Copy className="w-3 h-3" /></button>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${key.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 bg-slate-500/10'}`}>
                        <CheckCircle2 className="w-2.5 h-2.5" /> {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(key.scopes || []).slice(0, 2).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-400 font-mono">{s}</span>
                        ))}
                        {(key.scopes || []).length > 2 && <span className="text-[10px] text-slate-600">+{key.scopes.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">{key.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-bold text-white">Webhook Endpoints</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 rounded-lg text-xs font-semibold hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
              <Plus className="w-3 h-3" /> Add Endpoint
            </button>
          </div>
          {(app.webhooks || []).length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No webhook endpoints configured</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {(app.webhooks || []).map((w: any) => (
                <div key={w.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Webhook className="w-4 h-4 text-violet-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-300 truncate font-mono">{w.url}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${w.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 bg-slate-500/10'}`}>{w.status}</span>
                        <span className="text-[10px] text-slate-500">{w.retries} retries</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-4">{w.events.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}