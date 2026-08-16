'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Archive, HardDrive, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Clock, ArrowLeft, ShieldCheck, Download,
  FileText, GitCompare, Layers, Eye,
} from 'lucide-react';

const mockBackup = {
  id: 'bak-001',
  name: 'Pre-Release v3.2.0',
  type: 'pre_release',
  status: 'valid',
  size: '4.8 MB',
  appVersion: '3.2.0',
  migrationLevel: '3.2.0',
  checksum: 'sha256:abc123def456...',
  encrypted: true,
  modules: { templates: 24, brands: 3, sections: 18, translations: 42, campaigns: 8, automations: 5, transactional: 12, personalisation: 15 },
  records: 156,
  createdAt: '2026-07-17 02:00 UTC',
  validatedAt: '2026-07-17 02:01 UTC',
  expiresAt: '2027-01-17',
  retention: 'protected',
  restoreTest: { status: 'passed', runAt: '2026-07-17 03:15 UTC', duration: '42s', issues: 0 },
  warnings: [] as string[],
  errors: [] as string[],
  creator: 'admin@digitalfootprint.uk',
};

type RestoreScope = 'template' | 'template_family' | 'brand_kit' | 'campaign' | 'automation' | 'transactional' | 'complete';

export default function BackupDetailClient() {
  const [showRestore, setShowRestore] = useState(false);
  const [restoreScope, setRestoreScope] = useState<RestoreScope>('template');
  const [dryRestoreComplete, setDryRestoreComplete] = useState(false);
  const [restoreComplete, setRestoreComplete] = useState(false);

  const handleDryRestore = () => { setDryRestoreComplete(true); };
  const handleRestore = () => { setRestoreComplete(true); };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Archive className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{mockBackup.name}</h1>
            <Link href="/admin/email/backups" className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 mt-0.5">
              <ArrowLeft className="w-3 h-3" /> Back to Backups
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Snapshot Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-slate-500">Type:</span> <span className="text-white ml-2 capitalize">{mockBackup.type.replace(/_/g, ' ')}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="text-emerald-400 ml-2">Valid</span></div>
              <div><span className="text-slate-500">Size:</span> <span className="text-white ml-2">{mockBackup.size}</span></div>
              <div><span className="text-slate-500">Records:</span> <span className="text-white ml-2">{mockBackup.records}</span></div>
              <div><span className="text-slate-500">Version:</span> <span className="text-white ml-2 font-mono">{mockBackup.appVersion}</span></div>
              <div><span className="text-slate-500">Migration:</span> <span className="text-white ml-2 font-mono">{mockBackup.migrationLevel}</span></div>
              <div><span className="text-slate-500">Checksum:</span> <span className="text-white ml-2 font-mono text-xs">{mockBackup.checksum}</span></div>
              <div><span className="text-slate-500">Encrypted:</span> <span className="text-emerald-400 ml-2">{mockBackup.encrypted ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-500">Created:</span> <span className="text-white ml-2">{mockBackup.createdAt}</span></div>
              <div><span className="text-slate-500">Validated:</span> <span className="text-white ml-2">{mockBackup.validatedAt}</span></div>
              <div><span className="text-slate-500">Expires:</span> <span className="text-white ml-2">{mockBackup.expiresAt}</span></div>
              <div><span className="text-slate-500">Creator:</span> <span className="text-white ml-2">{mockBackup.creator}</span></div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" /> Modules & Counts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(mockBackup.modules).map(([key, count]) => (
                <div key={key} className="bg-white/[0.03] rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{count}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider capitalize">{key}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-400" /> Restore Test
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300">Passed</p>
                <p className="text-xs text-emerald-400/70">Run at {mockBackup.restoreTest.runAt} · Duration: {mockBackup.restoreTest.duration}</p>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Records validated successfully</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Dependencies resolved</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Representative templates rendered</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Brand assets accessible</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No emails sent during test</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Restore Actions</h3>
            {!showRestore ? (
              <div className="space-y-3">
                <button onClick={() => setShowRestore(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
                  <RefreshCw className="w-4 h-4" /> Restore Snapshot
                </button>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
                  <Eye className="w-4 h-4" /> Run Restore Test
                </button>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
                  <Download className="w-4 h-4" /> Download Snapshot
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Choose restore scope:</p>
                <div className="flex flex-wrap gap-2">
                  {(['template', 'template_family', 'brand_kit', 'campaign', 'automation', 'transactional', 'complete'] as RestoreScope[]).map((scope) => (
                    <button
                      key={scope}
                      onClick={() => setRestoreScope(scope)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                        restoreScope === scope
                          ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                          : 'bg-white/[0.03] text-slate-400 border border-[rgba(255,255,255,0.06)]'
                      }`}
                    >
                      {scope.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {!dryRestoreComplete ? (
                  <button onClick={handleDryRestore} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap">
                    <Eye className="w-4 h-4" /> Dry Restore
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                      <p className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Dry restore passed — 12 records staged</p>
                    </div>
                    {!restoreComplete ? (
                      <button onClick={handleRestore} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4" /> Confirm Restore
                      </button>
                    ) : (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                        <p className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Restored as Draft records — review and activate manually</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" /> Safety Rules
            </h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Default restore creates new Draft records — never overwrites production
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Production replacement requires admin permission and pre-restore backup
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Current active versions preserved until deliberate promotion
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                No email sent during restore tests
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}