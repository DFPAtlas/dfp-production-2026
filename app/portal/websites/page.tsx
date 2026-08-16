'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { getWebsiteStatusDef, getWebsiteTypeDef } from '@/lib/website-definitions';
import {
  Globe, ExternalLink, ArrowRight, Sparkles, Image, Monitor, Search,
  ChevronRight, Calendar, Layers,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';

interface Website {
  id: string;
  name: string;
  description?: string | null;
  primary_domain?: string | null;
  status: string;
  website_type: string;
  preview_image?: string | null;
  staging_url?: string | null;
  production_url?: string | null;
  client_staging_access?: boolean;
  client_production_access?: boolean;
  featured?: boolean;
  launch_target_date?: string | null;
  live_date?: string | null;
  hosting_plan?: string | null;
  support_plan?: string | null;
  created_at?: string;
  project_id?: string | null;
}

interface Project {
  id: string;
  name: string;
  current_phase?: string | null;
  progress?: number | null;
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) { setLoading(false); return; }

        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!clientData || cancelled) { setLoading(false); return; }

        const { data: webData, error: webErr } = await supabase
          .from('client_websites')
          .select('*')
          .eq('client_id', clientData.id)
          .eq('client_visible', true)
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (webErr) { setError(true); setLoading(false); return; }

        const siteList = (webData || []) as Website[];
        setWebsites(siteList);

        const projectIds = [...new Set(siteList.map(w => w.project_id).filter(Boolean))] as string[];
        if (projectIds.length > 0) {
          const { data: projData } = await supabase
            .from('projects')
            .select('id, name, current_phase, progress')
            .in('id', projectIds);
          if (projData) {
            const map: Record<string, Project> = {};
            for (const p of projData) map[p.id] = p;
            if (!cancelled) setProjects(map);
          }
        }

        setLoading(false);
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filters = [
    { key: 'all', label: 'All Websites' },
    { key: 'active', label: 'In Progress' },
    { key: 'live', label: 'Live' },
    { key: 'staging', label: 'Staging' },
  ];

  const filteredWebsites = (() => {
    if (activeFilter === 'all') return websites;
    if (activeFilter === 'active') return websites.filter(w => !['live', 'archived', 'paused'].includes(w.status));
    if (activeFilter === 'live') return websites.filter(w => w.status === 'live');
    if (activeFilter === 'staging') return websites.filter(w => ['staging', 'client_review', 'launch_ready'].includes(w.status));
    return websites;
  })();

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[34px]">My Websites</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review your websites, environments and launch progress.
          </p>
        </motion.div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 mb-4">
              <Globe className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm text-slate-400">Unable to load your websites.</p>
            <button onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#22D3EE] px-5 py-2.5 text-sm font-bold text-[#071221] transition-colors hover:bg-[#67E8F9]">
              Retry
            </button>
          </div>
        ) : websites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#06B6D4]/10 mb-5">
              <Monitor className="h-8 w-8 text-[#22D3EE]" />
            </div>
            <h3 className="text-lg font-semibold text-white">No websites yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Your websites will appear here once the Digital Footprint team completes the initial setup. We&apos;ll keep you updated on progress.
            </p>
            <Link href="/portal/projects"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm text-slate-300 hover:border-[#06B6D4]/30 transition-all">
              View your projects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-full p-1 w-fit">
              {filters.map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter === f.key ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredWebsites.map((w, i) => {
                const statusDef = getWebsiteStatusDef(w.status);
                const typeDef = getWebsiteTypeDef(w.website_type);
                const project = w.project_id ? projects[w.project_id] : null;
                return (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="group rounded-2xl border border-white/[0.09] bg-[#111F32] overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.13)] hover:border-white/[0.14] transition-all">
                    <div className="h-40 overflow-hidden bg-[#0D1929] relative">
                      {w.preview_image ? (
                        <img src={w.preview_image} alt={w.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center">
                            <Monitor className="w-7 h-7 text-[#22D3EE]" />
                          </div>
                          <span className="text-[9px] font-semibold tracking-[0.18em] text-slate-600 uppercase">Digital Footprint</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                          style={{ backgroundColor: `${statusDef.color}18`, color: statusDef.color }}>
                          {statusDef.label}
                        </span>
                        {w.featured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-[#8B5CF6]/20 text-[#C4B5FD]">Featured</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-base font-bold text-white truncate">{w.name}</h3>
                      {w.primary_domain && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{w.primary_domain}</p>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-slate-400">{typeDef.label}</span>
                        {project && (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#06B6D4]/8 text-[#22D3EE] truncate max-w-[140px]">{project.name}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {w.client_staging_access && w.staging_url && (
                          <a href={w.staging_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap">
                            <ExternalLink className="w-3 h-3" /> Staging
                          </a>
                        )}
                        {w.status === 'live' && w.production_url && (
                          <a href={w.production_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap">
                            <Globe className="w-3 h-3" /> Visit
                          </a>
                        )}
                      </div>

                      {(w.hosting_plan || w.support_plan || w.launch_target_date) && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] text-[10px] text-slate-500">
                          {w.hosting_plan && <span>{w.hosting_plan}</span>}
                          {w.support_plan && <span>{w.support_plan}</span>}
                          {w.launch_target_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(w.launch_target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/portal/websites/${w.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#22D3EE] text-[#071221] rounded-xl text-xs font-bold hover:bg-[#67E8F9] transition-colors cursor-pointer whitespace-nowrap">
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        {project && (
                          <Link href={`/portal/projects/${project.id}`}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap">
                            <Layers className="w-3.5 h-3.5" /> Project
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}