'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import { Database, HardDrive, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, Shield } from 'lucide-react';



export default function CommandBackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('digital_footprint_backups').select('*, digital_footprint_projects!inner(name)').order('created_at', { ascending: false });
    if (data) setBackups(data);
    setLoading(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) { case 'success': return { color: '#10B981', icon: CheckCircle2, label: 'Success' }; case 'failed': return { color: '#EF4444', icon: XCircle, label: 'Failed' }; case 'in_progress': return { color: '#F59E0B', icon: Clock, label: 'In Progress' }; default: return { color: '#64748B', icon: Clock, label: 'Awaiting' }; }
  };

  const failedBackups = backups.filter(b => b.status === 'failed');
  const overdueTests = backups.filter(b => b.recovery_tested_at && new Date(b.recovery_tested_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  if (loading) {
    return <CommandShell><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div></CommandShell>;
  }

  return (
    <CommandShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Backups</h1>
            <p className="text-sm text-slate-400">Database and code backup monitoring across all projects</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {(failedBackups.length > 0 || overdueTests.length > 0) && (
          <div className="mb-6 space-y-2">
            {failedBackups.map(b => (
              <div key={b.id} className="glass-card rounded-xl p-3 flex items-center gap-3 border border-red-500/10 bg-red-500/3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{b.digital_footprint_projects?.name}: Backup Failed</p>
                  <p className="text-xs text-slate-400">Type: {b.backup_type}</p>
                </div>
              </div>
            ))}
            {overdueTests.map(b => (
              <div key={b.id} className="glass-card rounded-xl p-3 flex items-center gap-3 border border-amber-500/10 bg-amber-500/3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{b.digital_footprint_projects?.name}: Recovery Test Overdue</p>
                  <p className="text-xs text-slate-400">Last tested: {new Date(b.recovery_tested_at).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {backups.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Database className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Awaiting Data</h3>
            <p className="text-sm text-slate-400">Backup records will appear once configured for each project</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {backups.map((backup, i) => {
              const ss = getStatusStyle(backup.status);
              return (
                <motion.div key={backup.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-sm truncate">{backup.digital_footprint_projects?.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: ss.color + '20', color: ss.color }}>{ss.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</div>
                      <div className="text-xs text-white capitalize">{backup.backup_type}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Backup</div>
                      <div className="text-xs text-white font-mono">
                        {backup.last_backup_at ? new Date(backup.last_backup_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Recovery Ready</div>
                      <div className="flex items-center gap-1.5">
                        {backup.recovery_ready ? (
                          <><Shield className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">Ready</span></>
                        ) : (
                          <><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-amber-400">Not Ready</span></>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Test</div>
                      <div className="text-xs text-white font-mono">
                        {backup.recovery_tested_at ? new Date(backup.recovery_tested_at).toLocaleDateString('en-GB') : 'Never'}
                      </div>
                    </div>
                  </div>

                  {backup.notes && (
                    <p className="mt-3 text-[11px] text-slate-400 line-clamp-2">{backup.notes}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </CommandShell>
  );
}