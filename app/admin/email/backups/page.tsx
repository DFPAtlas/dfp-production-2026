'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Archive, HardDrive, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Clock, Search, ArrowRight, ArrowLeft,
  ShieldCheck, Download, Eye, Plus,
} from 'lucide-react';

interface BackupSnapshot {
  id: string;
  name: string;
  type: string;
  status: string;
  size: string;
  modules: number;
  records: number;
  createdAt: string;
  expiresAt: string | null;
  restoreTest: string;
  retention: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sumCounts(counts: unknown): number {
  if (!counts || typeof counts !== 'object') return 0;
  const obj = counts as Record<string, unknown>;
  return Object.values(obj).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

function moduleCount(modules: unknown): number {
  if (!modules || typeof modules !== 'object') return 0;
  return Object.keys(modules as Record<string, unknown>).length;
}

function restoreTestStatus(restoreTest: unknown): string {
  if (restoreTest && typeof restoreTest === 'object') {
    const obj = restoreTest as Record<string, unknown>;
    if (typeof obj.status === 'string') return obj.status;
  }
  return 'not_tested';
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cl: string }> = {
    valid: { label: 'Valid', cl: 'text-emerald-400 bg-emerald-400/10' },
    expired: { label: 'Expired', cl: 'text-slate-500 bg-slate-500/10' },
    passed: { label: 'Passed', cl: 'text-emerald-400 bg-emerald-400/10' },
    not_tested: { label: 'Not Tested', cl: 'text-amber-400 bg-amber-400/10' },
    pending: { label: 'Pending', cl: 'text-sky-400 bg-sky-400/10' },
    failed: { label: 'Failed', cl: 'text-red-400 bg-red-400/10' },
    protected: { label: 'Protected', cl: 'text-violet-400 bg-violet-400/10' },
  };
  const info = map[status] || { label: status, cl: 'text-slate-400 bg-slate-400/10' };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${info.cl}`}>{info.label}</span>;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_backup_snapshots')
        .select('id, name, snapshot_type, status, file_size_bytes, modules, counts, restore_test, retention_tier, created_at, expires_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        setBackups((data as Record<string, unknown>[]).map((b) => ({
          id: b.id as string,
          name: (b.name as string) || 'Unnamed snapshot',
          type: (b.snapshot_type as string) || 'manual',
          status: (b.status as string) || 'valid',
          size: formatBytes(b.file_size_bytes as number | null),
          modules: moduleCount(b.modules),
          records: sumCounts(b.counts),
          createdAt: (b.created_at as string) || '',
          expiresAt: (b.expires_at as string) || null,
          restoreTest: restoreTestStatus(b.restore_test),
          retention: (b.retention_tier as string) || 'weekly',
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = backups.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  const validBackups = backups.filter((b) => b.status === 'valid');
  const totalSizeMB = validBackups.reduce((sum, b) => {
    const n = parseFloat(b.size);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const passedTests = backups.filter((b) => b.restoreTest === 'passed').length;
  const pendingTests = backups.filter((b) => b.restoreTest === 'pending').length;
  const notTested = backups.filter((b) => b.restoreTest === 'not_tested').length;
  const protectedCount = backups.filter((b) => b.retention === 'protected').length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Archive className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Backup Snapshots</h1>
            <Link href="/admin/email/portability" className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 mt-0.5">
              <ArrowLeft className="w-3 h-3" /> Back to Portability
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Organisation-scoped logical snapshots — configuration, templates, brands, campaigns, automations and transactional mappings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Archive className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-400 uppercase tracking-wider">Snapshots</span></div>
          <p className="text-2xl font-bold text-white">{backups.length}</p>
          <p className="text-xs text-slate-500 mt-1">{validBackups.length} valid</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><HardDrive className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-400 uppercase tracking-wider">Storage</span></div>
          <p className="text-2xl font-bold text-white">{totalSizeMB.toFixed(1)} MB</p>
          <p className="text-xs text-slate-500 mt-1">Total across valid snapshots</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><RefreshCw className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-400 uppercase tracking-wider">Restore Tests</span></div>
          <p className="text-2xl font-bold text-emerald-400">{passedTests}</p>
          <p className="text-xs text-slate-500 mt-1">Passed · {pendingTests} pending · {notTested} not tested</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-400 uppercase tracking-wider">Protected</span></div>
          <p className="text-2xl font-bold text-violet-400">{protectedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Protected snapshots</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search backups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Create Backup
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#121215] border border-[#06B6D4]/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Create Backup Snapshot</h3>
          <p className="text-xs text-amber-400 mb-4">Snapshot creation requires the backup worker. This action is not yet wired to the scheduler.</p>
          <button onClick={() => setShowCreate(false)} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Cancel</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Archive className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{backups.length === 0 ? 'No backup snapshots yet' : 'No backups match your search'}</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Name</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Type</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Size</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Records</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Restore Test</th>
                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Retention</th>
                <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bak) => (
                <tr key={bak.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/email/backups/${bak.id}`} className="text-white font-medium hover:text-[#06B6D4] transition-colors cursor-pointer">
                      {bak.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs capitalize">{bak.type.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{bak.size}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{bak.records}</td>
                  <td className="px-5 py-3"><StatusBadge status={bak.status} /></td>
                  <td className="px-5 py-3"><StatusBadge status={bak.restoreTest} /></td>
                  <td className="px-5 py-3"><StatusBadge status={bak.retention} /></td>
                  <td className="px-5 py-3 text-slate-500 text-xs text-right">{bak.createdAt ? new Date(bak.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/email/settings/backup" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
          <ShieldCheck className="w-4 h-4" /> Backup Settings
        </Link>
      </div>
    </div>
  );
}