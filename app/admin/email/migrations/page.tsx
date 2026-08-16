'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GitCompare, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  FileText, Search, ShieldCheck, Package, ArrowLeft,
} from 'lucide-react';

const mockMigrators = [
  { id: 'mig-001', name: 'Template v2 → v3', from: '2.0.0', to: '3.0.0', sourceType: 'template', status: 'active', transforms: 5, tests: 12, lastRun: '2026-07-15' },
  { id: 'mig-002', name: 'Personalisation Rules v1 → v2', from: '1.0.0', to: '2.0.0', sourceType: 'personalisation', status: 'active', transforms: 3, tests: 8, lastRun: '2026-07-10' },
  { id: 'mig-003', name: 'Legacy HTML → Structured v1', from: 'legacy_html', to: '1.0.0', sourceType: 'template', status: 'active', transforms: 8, tests: 15, lastRun: '2026-07-05' },
  { id: 'mig-004', name: 'Brand Kit v1 → v2', from: '1.0.0', to: '2.0.0', sourceType: 'brand', status: 'deprecated', transforms: 2, tests: 4, lastRun: '2026-06-20' },
  { id: 'mig-005', name: 'Campaign Schema v3 → v4', from: '3.0.0', to: '4.0.0', sourceType: 'campaign', status: 'draft', transforms: 6, tests: 0, lastRun: '—' },
];

const mockAdapters = [
  { id: 'adp-001', name: 'Mailchimp Template Adapter', source: 'Mailchimp', version: '2024', status: 'active', mappedFields: 18, limitations: ['No dynamic content blocks', 'No automation definitions', 'Images referenced only'] },
  { id: 'adp-002', name: 'HubSpot Email Adapter', source: 'HubSpot', version: '2024', status: 'active', mappedFields: 14, limitations: ['No personalisation rules', 'No brand kits', 'HTML-only import'] },
  { id: 'adp-003', name: 'Brevo (Sendinblue) Adapter', source: 'Brevo', version: '2024', status: 'draft', mappedFields: 10, limitations: ['Limited template support', 'No transactional mappings'] },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cl: string }> = {
    active: { label: 'Active', cl: 'text-emerald-400 bg-emerald-400/10' },
    deprecated: { label: 'Deprecated', cl: 'text-amber-400 bg-amber-400/10' },
    draft: { label: 'Draft', cl: 'text-slate-400 bg-slate-400/10' },
    compatible: { label: 'Compatible', cl: 'text-emerald-400 bg-emerald-400/10' },
    blocked: { label: 'Blocked', cl: 'text-red-400 bg-red-400/10' },
  };
  const info = map[status] || { label: status, cl: 'text-slate-400 bg-slate-400/10' };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${info.cl}`}>{info.label}</span>;
}

export default function MigrationsPage() {
  const [activeTab, setActiveTab] = useState<'migrators' | 'adapters' | 'test'>('migrators');

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <GitCompare className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Package Migrations</h1>
            <Link href="/admin/email/portability" className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 mt-0.5">
              <ArrowLeft className="w-3 h-3" /> Back to Portability
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Manage version-to-version package migrators, third-party adapters and compatibility testing.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
        {([
          { key: 'migrators' as const, label: 'Version Migrators', count: mockMigrators.length },
          { key: 'adapters' as const, label: 'Third-Party Adapters', count: mockAdapters.length },
          { key: 'test' as const, label: 'Test Fixtures', count: 0 },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#06B6D4] text-[#06B6D4]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === 'migrators' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search migrators..."
                className="w-full pl-9 pr-4 py-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Name</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">From → To</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Type</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Transforms</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Tests</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Last Run</th>
                </tr>
              </thead>
              <tbody>
                {mockMigrators.map((mig) => (
                  <tr key={mig.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{mig.name}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">{mig.from} → {mig.to}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs capitalize">{mig.sourceType}</td>
                    <td className="px-5 py-3 text-slate-300 text-xs">{mig.transforms}</td>
                    <td className="px-5 py-3 text-slate-300 text-xs">{mig.tests}</td>
                    <td className="px-5 py-3"><StatusBadge status={mig.status} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs text-right">{mig.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" /> Migrator Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Each migrator accepts one known version</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Produces exactly the next version</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Preserves source data during transformation</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Records all transformations for audit</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Validates output after migration</div>
              <div className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400" /> Never claims unknown version support</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'adapters' && (
        <div className="space-y-4">
          {mockAdapters.map((adapter) => (
            <div key={adapter.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{adapter.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{adapter.source} v{adapter.version}</p>
                </div>
                <StatusBadge status={adapter.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Mapped Fields ({adapter.mappedFields})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Template Name', 'Subject', 'HTML Body', 'Plain Text', 'From Name', 'From Email', 'Reply-To', 'Preview Text', 'Language', 'Category'].slice(0, adapter.mappedFields > 10 ? 10 : adapter.mappedFields).map((f) => (
                      <span key={f} className="px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded-md text-[10px] text-sky-400">{f}</span>
                    ))}
                    {adapter.mappedFields > 10 && <span className="px-2 py-1 bg-sky-500/10 rounded-md text-[10px] text-sky-400">+{adapter.mappedFields - 10} more</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Limitations</p>
                  <ul className="space-y-1">
                    {adapter.limitations.map((lim, i) => (
                      <li key={i} className="text-xs text-amber-400/80 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {lim}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-semibold text-amber-300">Important</h4>
            </div>
            <p className="text-xs text-amber-400/80">
              Third-party adapters document supported features honestly. We do not claim universal compatibility with any platform. Each adapter is tested against specific source versions and maps only explicitly supported fields. Features not listed are excluded during import.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm font-semibold text-white mb-2">Test Fixtures</p>
          <p className="text-xs text-slate-500 mb-6">
            Each migrator should include test fixtures — representative packages at the from-version to validate transformations.
            Upload test fixtures to verify migrator correctness.
          </p>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
            <FileText className="w-4 h-4" /> Upload Test Fixture
          </button>
        </div>
      )}
    </div>
  );
}