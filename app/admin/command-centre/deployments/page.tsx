'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import { Rocket, GitBranch, GitCommit, CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';



export default function CommandDeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('digital_footprint_deployments').select('*, digital_footprint_projects!inner(name, github_url)').order('created_at', { ascending: false });
    if (data) setDeployments(data);
    setLoading(false);
  };

  const getBuildStatusStyle = (status: string) => {
    switch (status) { case 'success': return { color: '#10B981', icon: CheckCircle2 }; case 'failed': return { color: '#EF4444', icon: XCircle }; case 'building': return { color: '#F59E0B', icon: Clock }; default: return { color: '#64748B', icon: Clock }; }
  };

  const getDeployStatusStyle = (status: string) => {
    switch (status) { case 'live': return { color: '#10B981', label: 'Live' }; case 'failed': return { color: '#EF4444', label: 'Failed' }; case 'deploying': return { color: '#F59E0B', label: 'Deploying' }; case 'rolled_back': return { color: '#F97316', label: 'Rolled Back' }; default: return { color: '#64748B', label: 'Awaiting' }; }
  };

  if (loading) {
    return <CommandShell><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div></CommandShell>;
  }

  return (
    <CommandShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Deployments</h1>
            <p className="text-sm text-slate-400">Track builds and deployments across all projects</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {deployments.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Rocket className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Awaiting Data</h3>
            <p className="text-sm text-slate-400">Deployment data will appear here once integrations are configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deployments.map((dep, i) => {
              const buildStyle = getBuildStatusStyle(dep.build_status);
              const deployStyle = getDeployStatusStyle(dep.deployment_status);
              return (
                <motion.div key={dep.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">{dep.digital_footprint_projects?.name || 'Unknown'}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: deployStyle.color + '20', color: deployStyle.color }}>{deployStyle.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Repository</div>
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <GitBranch className="w-3 h-3 text-slate-400" />
                        <span className="truncate font-mono">{dep.github_repo || '--'}</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Branch</div>
                      <div className="text-xs text-white font-mono">{dep.branch || 'main'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Build</div>
                      <div className="flex items-center gap-1.5">
                        <buildStyle.icon className="w-3.5 h-3.5" style={{ color: buildStyle.color }} />
                        <span className="text-xs text-white capitalize">{dep.build_status || 'Awaiting'}</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Latest Commit</div>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 truncate">
                        <GitCommit className="w-3 h-3 text-slate-400 shrink-0" />
                        {dep.latest_commit ? dep.latest_commit.slice(0, 7) : '--'}
                      </div>
                    </div>
                  </div>

                  {dep.deployed_at && (
                    <div className="text-[10px] text-slate-500">
                      Last deployed: {new Date(dep.deployed_at).toLocaleString('en-GB')}
                    </div>
                  )}

                  {dep.build_errors && (
                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[11px] font-semibold text-red-400">Build Errors</span>
                      </div>
                      <p className="text-[11px] text-red-300 line-clamp-2 font-mono">{dep.build_errors}</p>
                    </div>
                  )}

                  {dep.digital_footprint_projects?.github_url && (
                    <a href={dep.digital_footprint_projects.github_url} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#06B6D4] hover:underline cursor-pointer">
                      <ExternalLink className="w-3 h-3" />View Repository
                    </a>
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