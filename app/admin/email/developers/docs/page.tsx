'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search, Key, Shield, Webhook, FileText, FlaskConical, Terminal, Clock, ExternalLink, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DocSection { id: string; title: string; icon: React.ElementType; subsections: string[]; }

const DOC_SECTIONS: DocSection[] = [
  { id: 'authentication', title: 'Authentication', icon: Key, subsections: ['API Key Format','Header Authentication','Key Rotation','Expiry & Renewal'] },
  { id: 'scopes', title: 'Scopes & Permissions', icon: Shield, subsections: ['Available Scopes','High-Risk Scopes','Scope Inheritance','Checking Scopes'] },
  { id: 'environments', title: 'Environments', icon: FlaskConical, subsections: ['Sandbox vs Production','Base URLs','Environment Headers','Data Isolation'] },
  { id: 'api-versions', title: 'API Versions', icon: Code2, subsections: ['Version Format','Breaking Changes','Deprecation Policy','Migration Guides'] },
  { id: 'endpoints', title: 'Endpoints', icon: Terminal, subsections: ['Transactional Send','Automation Trigger','Campaigns','Templates','Contacts'] },
  { id: 'schemas', title: 'Event Schemas', icon: FileText, subsections: ['Schema Registry','Versioning','Validation Rules','Field Reference'] },
  { id: 'pagination', title: 'Pagination & Responses', icon: FileText, subsections: ['Cursor Pagination','Response Format','Error Codes','Rate-Limit Headers'] },
  { id: 'idempotency', title: 'Idempotency', icon: CheckCircle2, subsections: ['Idempotency Keys','Idempotency Windows','Conflict Handling','Best Practices'] },
  { id: 'rate-limits', title: 'Rate Limits', icon: Shield, subsections: ['Limit Tiers','Burst vs Sustained','Headers','Backoff Strategy'] },
  { id: 'webhooks', title: 'Webhooks', icon: Webhook, subsections: ['Available Events','Signing & Verification','Retry Policy','Payload Reference'] },
  { id: 'errors', title: 'Error Codes', icon: AlertTriangle, subsections: ['Error Format','Standard Codes','Validation Errors','Resolution Tips'] },
  { id: 'sandbox', title: 'Sandbox Guide', icon: FlaskConical, subsections: ['Getting Started','Test Data','API Explorer','Limitations'] },
  { id: 'security', title: 'Security Best Practices', icon: Shield, subsections: ['Key Storage','IP Restrictions','TLS Requirements','Secret Rotation'] },
  { id: 'changelog', title: 'Changelog', icon: Clock, subsections: ['v1.2 — June 2026','v1.1 — April 2026','v1.0 — March 2026'] },
];

const ERROR_CODES = [
  { code: 'authentication_failed', desc: 'Invalid or missing API key', resolution: 'Check your Authorization header and key validity' },
  { code: 'key_expired', desc: 'The API key has expired', resolution: 'Rotate your key or generate a new one' },
  { code: 'scope_denied', desc: 'Key does not have required scope', resolution: 'Request the required scope or use a key with correct permissions' },
  { code: 'organisation_mismatch', desc: 'Request organisation does not match key', resolution: 'Ensure you are using the correct key for this organisation' },
  { code: 'validation_failed', desc: 'Request body failed schema validation', resolution: 'Check your payload against the published schema' },
  { code: 'resource_not_found', desc: 'Requested resource does not exist', resolution: 'Verify the resource ID or event key' },
  { code: 'conflict', desc: 'Resource state prevents this operation', resolution: 'Check the current state and try again' },
  { code: 'rate_limit_exceeded', desc: 'Too many requests', resolution: 'Back off and respect Retry-After header' },
  { code: 'idempotency_conflict', desc: 'Idempotency key reused with different payload', resolution: 'Use a new unique idempotency key' },
  { code: 'sender_unverified', desc: 'Sender profile not verified', resolution: 'Verify your sender domain and profile' },
  { code: 'template_not_active', desc: 'Template is not in active state', resolution: 'Activate the template or use an active one' },
  { code: 'recipient_suppressed', desc: 'Recipient is suppressed or unsubscribed', resolution: 'Do not send to suppressed recipients' },
  { code: 'approval_required', desc: 'Action requires approval', resolution: 'Request approval through the Email Studio' },
  { code: 'provider_unavailable', desc: 'Email provider is temporarily unavailable', resolution: 'Retry with exponential backoff' },
  { code: 'queue_unavailable', desc: 'Send queue is currently unavailable', resolution: 'Retry later or check system health' },
  { code: 'internal_error', desc: 'Unexpected server error', resolution: 'Contact support with your request ID' },
];

export default function DeveloperDocs() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = DOC_SECTIONS.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.subsections.some((ss) => ss.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">API Documentation</h1>
              <p className="text-sm text-slate-400 mt-0.5">Complete reference for the Email Studio Developer Platform — authentication, endpoints, schemas, webhooks and more.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/developers" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search documentation..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
          </div>
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="p-1 space-y-0.5">
              {filtered.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <div key={section.id}>
                    <button onClick={() => setActiveSection(isActive ? null : section.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
                      <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="flex-1 text-left">{section.title}</span>
                      <span className="text-[10px] text-slate-600">{section.subsections.length} topics</span>
                    </button>
                    {isActive && (
                      <div className="ml-9 mb-1 space-y-0.5">
                        {section.subsections.map((sub) => (
                          <div key={sub} className="px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] cursor-pointer">{sub}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">Quick Start</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0 mt-0.5">1</div>
                <div>
                  <h3 className="text-sm font-medium text-white">Register an Application</h3>
                  <p className="text-xs text-slate-400 mt-1">Create an application in the Developer Dashboard. Choose sandbox for testing or production for live access.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0 mt-0.5">2</div>
                <div>
                  <h3 className="text-sm font-medium text-white">Generate an API Key</h3>
                  <p className="text-xs text-slate-400 mt-1">Generate a scoped API key under your application. Copy the secret immediately — it is shown only once.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0 mt-0.5">3</div>
                <div>
                  <h3 className="text-sm font-medium text-white">Make Your First Request</h3>
                  <p className="text-xs text-slate-400 mt-1">Use the sandbox environment to test. Include your key as a Bearer token in the Authorization header.</p>
                  <div className="bg-black/40 border border-[rgba(255,255,255,0.06)] rounded-xl p-3 mt-2">
                    <code className="text-[11px] text-emerald-300 font-mono">curl -H &quot;Authorization: Bearer dfp_sk_...&quot; https://api.digitalfootprint.uk/api/email-studio/v1/templates</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-sm font-bold text-white">Error Code Reference</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Error Code</th>
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {ERROR_CODES.map((err) => (
                    <tr key={err.code} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <code className="text-xs text-red-400 font-mono whitespace-nowrap">{err.code}</code>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{err.desc}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{err.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}