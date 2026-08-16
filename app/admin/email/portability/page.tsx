'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package, Download, Upload, Archive, RefreshCw, ArrowRight,
  CheckCircle2, XCircle, AlertTriangle, Clock, FileArchive,
  ShieldCheck, HardDrive, Database, GitCompare, Search,
} from 'lucide-react';

const mockExportJobs = [
  { id: 'exp-001', name: 'Welcome Series Bundle', type: 'template_family', status: 'completed', fileSize: '284 KB', createdAt: '2026-07-18 14:22' },
  { id: 'exp-002', name: 'Brand Kit — Acme Corp', type: 'brand_kit', status: 'completed', fileSize: '1.2 MB', createdAt: '2026-07-17 09:15' },
  { id: 'exp-003', name: 'Q3 Campaign Content', type: 'campaign_content', status: 'completed', fileSize: '456 KB', createdAt: '2026-07-16 11:40' },
  { id: 'exp-004', name: 'Transactional Mappings v2', type: 'transactional', status: 'failed', fileSize: '—', createdAt: '2026-07-15 16:08' },
  { id: 'exp-005', name: 'Automation Definitions', type: 'automation', status: 'completed', fileSize: '192 KB', createdAt: '2026-07-14 08:55' },
];

const mockImportJobs = [
  { id: 'imp-001', name: 'Legacy Template — Monthly Digest', source: 'legacy_html', status: 'completed', records: 3, warnings: 2, createdAt: '2026-07-18 10:30' },
  { id: 'imp-002', name: 'Migrated Welcome Series', source: 'package', status: 'dry_run_passed', records: 8, warnings: 0, createdAt: '2026-07-17 15:45' },
  { id: 'imp-003', name: 'Third-Party Newsletter Template', source: 'mailchimp_adapter', status: 'needs_review', records: 2, warnings: 4, createdAt: '2026-07-16 12:10' },
];

const mockBackups = [
  { id: 'bak-001', name: 'Pre-Release v3.2.0', type: 'pre_release', status: 'valid', size: '4.8 MB', age: '2 days ago', restoreTest: 'passed' },
  { id: 'bak-002', name: 'Weekly — Templates & Brands', type: 'scheduled', status: 'valid', size: '3.2 MB', age: '5 days ago', restoreTest: 'passed' },
  { id: 'bak-003', name: 'Pre-Migration — Campaigns', type: 'pre_migration', status: 'valid', size: '1.6 MB', age: '1 week ago', restoreTest: 'not_tested' },
  { id: 'bak-004', name: 'Complete Config (no contacts)', type: 'complete_config', status: 'valid', size: '8.1 MB', age: '2 weeks ago', restoreTest: 'passed' },
  { id: 'bak-005', name: 'Manual — Before v3.1 upgrade', type: 'manual', status: 'expired', size: '3.5 MB', age: '45 days ago', restoreTest: 'expired' },
];

const mockMigrations = [
  { id: 'mig-001', name: 'Template v2 → v3', from: '2.0.0', to: '3.0.0', status: 'active', lastRun: '2026-07-15' },
  { id: 'mig-002', name: 'Personalisation Rules v1 → v2', from: '1.0.0', to: '2.0.0', status: 'active', lastRun: '2026-07-10' },
  { id: 'mig-003', name: 'Legacy HTML → Structured', from: 'legacy_html', to: '1.0.0', status: 'active', lastRun: '2026-07-05' },
];

function StatCard({ icon: Icon, label, value, sub, color = 'default' }: { icon: React.ElementType; label: string; value: string; sub: string; color?: string }) {
  const colorMap: Record<string, string> = {
    default: 'border-[rgba(255,255,255,0.06)] bg-[#121215]',
    green: 'border-emerald-500/15 bg-emerald-500/5',
    amber: 'border-amber-500/15 bg-amber-500/5',
    red: 'border-red-500/15 bg-red-500/5',
  };
  return (
    <div className={`${colorMap[color]} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cl: string }> = {
    completed: { label: 'Completed', cl: 'text-emerald-400 bg-emerald-400/10' },
    failed: { label: 'Failed', cl: 'text-red-400 bg-red-400/10' },
    dry_run_passed: { label: 'Dry Run Passed', cl: 'text-sky-400 bg-sky-400/10' },
    needs_review: { label: 'Needs Review', cl: 'text-amber-400 bg-amber-400/10' },
    valid: { label: 'Valid', cl: 'text-emerald-400 bg-emerald-400/10' },
    expired: { label: 'Expired', cl: 'text-slate-500 bg-slate-500/10' },
    active: { label: 'Active', cl: 'text-emerald-400 bg-emerald-400/10' },
    passed: { label: 'Passed', cl: 'text-emerald-400 bg-emerald-400/10' },
    not_tested: { label: 'Not Tested', cl: 'text-amber-400 bg-amber-400/10' },
  };
  const info = map[status] || { label: status, cl: 'text-slate-400 bg-slate-400/10' };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${info.cl}`}>{info.label}</span>;
}

export default function PortabilityDashboard() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Portability & Backup</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Export, import, migrate and back up Email Studio content — templates, brands, campaigns, automations and configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Download} label="Recent Exports" value="4" sub="Last 7 days · 3 completed, 1 failed" color="default" />
        <StatCard icon={Upload} label="Recent Imports" value="3" sub="1 dry run passed · 2 imports completed" color="default" />
        <StatCard icon={Archive} label="Backup Snapshots" value="5" sub="4 valid · 1 expired · 8.1 MB latest" color="green" />
        <StatCard icon={RefreshCw} label="Last Restore Test" value="2 days ago" sub="Pre-release snapshot · Passed" color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/admin/email/exports" className="flex items-center gap-3 px-5 py-4 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white group-hover:text-[#06B6D4] transition-colors">Export Wizard</p>
            <p className="text-xs text-slate-500 mt-0.5">Package templates, brands, campaigns or full configuration</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#06B6D4] ml-auto shrink-0 transition-colors" />
        </Link>
        <Link href="/admin/email/imports/templates" className="flex items-center gap-3 px-5 py-4 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white group-hover:text-[#06B6D4] transition-colors">Import Wizard</p>
            <p className="text-xs text-slate-500 mt-0.5">Upload packages or legacy HTML with validation and dry run</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#06B6D4] ml-auto shrink-0 transition-colors" />
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-400" /> Recent Exports
        </h2>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Name</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Type</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Size</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockExportJobs.map((job) => (
                <tr key={job.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{job.name}</td>
                  <td className="px-5 py-3 text-slate-400 capitalize text-xs">{job.type.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{job.fileSize}</td>
                  <td className="px-5 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right">{job.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-slate-400" /> Recent Imports
        </h2>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Name</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Source</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Records</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockImportJobs.map((job) => (
                <tr key={job.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{job.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs capitalize">{job.source.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{job.records} records</td>
                  <td className="px-5 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right">{job.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Archive className="w-4 h-4 text-slate-400" /> Backup Snapshots
        </h2>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Name</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Type</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Size</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Age</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Restore Test</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockBackups.map((bak) => (
                <tr key={bak.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/email/backups/${bak.id}`} className="text-white font-medium hover:text-[#06B6D4] transition-colors cursor-pointer">
                      {bak.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs capitalize">{bak.type.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{bak.size}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{bak.age}</td>
                  <td className="px-5 py-3"><StatusBadge status={bak.restoreTest} /></td>
                  <td className="px-5 py-3"><StatusBadge status={bak.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-slate-400" /> Package Migrators
        </h2>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Name</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">From → To</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {mockMigrations.map((mig) => (
                <tr key={mig.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{mig.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{mig.from} → {mig.to}</td>
                  <td className="px-5 py-3"><StatusBadge status={mig.status} /></td>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right">{mig.lastRun}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/email/exports" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
          <Download className="w-4 h-4" /> New Export
        </Link>
        <Link href="/admin/email/imports/templates" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
          <Upload className="w-4 h-4" /> New Import
        </Link>
        <Link href="/admin/email/backups" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
          <Archive className="w-4 h-4" /> Manage Backups
        </Link>
        <Link href="/admin/email/migrations" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
          <GitCompare className="w-4 h-4" /> Migrations
        </Link>
      </div>
    </div>
  );
}