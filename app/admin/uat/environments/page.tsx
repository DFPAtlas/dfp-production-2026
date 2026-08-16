'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Server, Search, Filter, RefreshCw, ExternalLink, Globe,
  ChevronDown, FolderKanban, Power,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface UatEnvironment {
  id: string;
  project_id: string;
  environment_name: string;
  environment_type: string;
  base_url: string;
  login_url: string | null;
  admin_login_url: string | null;
  tester_login_url: string | null;
  current_build: string | null;
  version: string | null;
  git_branch: string | null;
  is_active: boolean;
  project_name?: string;
}

const envTypeConfig: Record<string, { color: string; bg: string }> = {
  development: { color: '#8B5CF6', bg: 'bg-violet-500/10' },
  uat: { color: '#06B6D4', bg: 'bg-cyan-500/10' },
  staging: { color: '#F59E0B', bg: 'bg-amber-500/10' },
  production: { color: '#10B981', bg: 'bg-emerald-500/10' },
  demo: { color: '#EC4899', bg: 'bg-pink-500/10' },
};

export default function AdminUATEnvironmentsPage() {
  const [environments, setEnvironments] = useState<UatEnvironment[]>([]);
  const [filteredEnvs, setFilteredEnvs] = useState<UatEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: envData } = await supabase.from('uat_environments').select('*').order('created_at', { ascending: false });
    const { data: projData } = await supabase.from('uat_projects').select('id, name');

    if (envData && projData) {
      const projectMap: Record<string, string> = {};
      projData.forEach((p: any) => { projectMap[p.id] = p.name; });

      const merged = (envData as UatEnvironment[]).map((env) => ({
        ...env,
        project_name: projectMap[env.project_id] || 'Unknown',
      }));

      setEnvironments(merged);
      setFilteredEnvs(merged);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = environments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) =>
        e.environment_name.toLowerCase().includes(q) ||
        e.base_url.toLowerCase().includes(q) ||
        (e.project_name && e.project_name.toLowerCase().includes(q)) ||
        (e.version && e.version.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== 'all') filtered = filtered.filter((e) => e.environment_type === typeFilter);
    if (activeFilter === 'active') filtered = filtered.filter((e) => e.is_active);
    if (activeFilter === 'inactive') filtered = filtered.filter((e) => !e.is_active);
    setFilteredEnvs(filtered);
  }, [searchQuery, typeFilter, activeFilter, environments]);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">UAT Environments</h1>
          <p className="text-sm text-slate-400 mt-0.5">All test environments across registered projects</p>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, URL, version, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="development">Development</option>
                  <option value="uat">UAT</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="demo">Demo</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="pl-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button
                onClick={() => { setRefreshing(true); fetchData(); }}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Environment</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Base URL</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Build</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnvs.map((env) => {
                  const etc = envTypeConfig[env.environment_type] || envTypeConfig.uat;
                  return (
                    <tr key={env.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <span className="text-sm font-semibold text-white">{env.environment_name}</span>
                      </td>
                      <td className="py-4 px-5">
                        <Link href={`/admin/uat/projects/${env.project_id}`} className="text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                          {env.project_name}
                        </Link>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: etc.bg, color: etc.color }}>
                          {env.environment_type}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <a href={env.base_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-[#06B6D4] transition-colors flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[220px]">{env.base_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-400 font-mono">{env.version || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-400 font-mono">{env.current_build || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${env.is_active ? 'text-[#10B981] bg-[#10B981]/10' : 'text-slate-500 bg-slate-500/10'}`}>
                          <Power className="w-3 h-3" />
                          {env.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEnvs.length === 0 && (
            <div className="text-center py-16">
              <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No environments found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || typeFilter !== 'all' || activeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add environments from the project detail page'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}