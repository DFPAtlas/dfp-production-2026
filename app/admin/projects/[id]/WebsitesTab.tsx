'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { getWebsiteStatusDef, getWebsiteTypeDef, WEBSITE_STATUSES, WEBSITE_TYPES } from '@/lib/website-definitions';
import {
  Globe, Plus, X, Loader2, ExternalLink, Edit2, Eye, Trash2,
  CheckCircle, Image, Link2, Calendar, Building2,
} from 'lucide-react';

interface Website {
  id: string;
  client_id?: string | null;
  project_id?: string;
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
  ssl_status?: string | null;
  maintenance_status?: string;
  client_visible?: boolean;
  created_at?: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string | null;
}

interface Client {
  id: string;
  company_name: string | null;
}

export default function WebsitesTab({ project }: { project: Project; onProjectUpdated?: () => void }) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Website>>({
    name: '',
    primary_domain: '',
    status: 'setup',
    website_type: 'brochure',
    client_staging_access: false,
    client_production_access: false,
    featured: false,
    client_visible: true,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, [project.id]);

  async function loadData() {
    setLoading(true);
    const [webRes, clientsRes] = await Promise.all([
      supabase.from('client_websites').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name').order('company_name'),
    ]);
    if (webRes.data) setWebsites(webRes.data as Website[]);
    if (clientsRes.data) setClients(clientsRes.data as Client[]);
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      name: '',
      primary_domain: '',
      status: 'setup',
      website_type: 'brochure',
      client_staging_access: false,
      client_production_access: false,
      featured: false,
      client_visible: true,
      client_id: project.client_id,
      project_id: project.id,
    });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(website: Website) {
    setEditingId(website.id);
    setForm({ ...website });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    setFormError('');
    if (!form.name?.trim()) { setFormError('Website name is required'); return; }

    setSaving(true);
    const payload = {
      name: form.name?.trim(),
      description: form.description || null,
      primary_domain: form.primary_domain || null,
      status: form.status || 'setup',
      website_type: form.website_type || 'brochure',
      preview_image: form.preview_image || null,
      staging_url: form.staging_url || null,
      production_url: form.production_url || null,
      client_staging_access: form.client_staging_access || false,
      client_production_access: form.client_production_access || false,
      featured: form.featured || false,
      launch_target_date: form.launch_target_date || null,
      live_date: form.live_date || null,
      hosting_plan: form.hosting_plan || null,
      support_plan: form.support_plan || null,
      ssl_status: form.ssl_status || null,
      maintenance_status: form.maintenance_status || 'none',
      client_visible: form.client_visible !== false,
      client_id: project.client_id,
      project_id: project.id,
    };

    let error: any;
    if (editingId) {
      const res = await supabase.from('client_websites').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('client_websites').insert(payload);
      error = res.error;
    }

    setSaving(false);
    if (error) { setFormError(error.message); return; }

    if (form.featured && project.client_id) {
      await supabase.from('client_websites')
        .update({ featured: false })
        .eq('client_id', project.client_id)
        .neq('id', editingId || '');
    }

    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this website? This cannot be undone.')) return;
    await supabase.from('client_websites').delete().eq('id', id);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Client Websites</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage website records visible to the client in their portal.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#06B6D4] text-white rounded-xl text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Website
        </button>
      </div>

      {websites.length === 0 ? (
        <div className="text-center py-16 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Globe className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No websites linked to this project.</p>
          <button onClick={openCreate}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Create first website
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {websites.map(w => {
            const statusDef = getWebsiteStatusDef(w.status);
            const typeDef = getWebsiteTypeDef(w.website_type);
            return (
              <div key={w.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.14)] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {w.preview_image ? (
                      <img src={w.preview_image} alt={w.name}
                        className="w-20 h-14 rounded-lg object-cover object-top shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-20 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{w.name}</p>
                        {w.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">Featured</span>}
                        {!w.client_visible && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">Hidden</span>}
                      </div>
                      {w.primary_domain && <p className="text-xs text-slate-400 mt-0.5 truncate">{w.primary_domain}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                          style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                          {statusDef.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-slate-400">{typeDef.label}</span>
                        {w.staging_url && <span className="text-[10px] text-slate-500">Staging {w.client_staging_access ? 'visible' : 'hidden'}</span>}
                        {w.production_url && w.status === 'live' && <span className="text-[10px] text-emerald-400">Live</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {w.staging_url && (
                      <a href={w.staging_url} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        title="Open staging"><ExternalLink className="w-4 h-4" /></a>
                    )}
                    {w.production_url && (
                      <a href={w.production_url} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Open production"><Globe className="w-4 h-4" /></a>
                    )}
                    <button onClick={() => openEdit(w)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
                      title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(w.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Website' : 'New Website'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Website Name *</label>
                  <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="My Website"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Domain</label>
                  <input type="text" value={form.primary_domain || ''} onChange={e => setForm({ ...form, primary_domain: e.target.value })}
                    placeholder="example.com"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <div className="relative">
                    <select value={form.status || 'setup'} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all pr-8">
                      {WEBSITE_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Website Type</label>
                  <div className="relative">
                    <select value={form.website_type || 'brochure'} onChange={e => setForm({ ...form, website_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all pr-8">
                      {WEBSITE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Client-facing description..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Staging URL</label>
                  <input type="url" value={form.staging_url || ''} onChange={e => setForm({ ...form, staging_url: e.target.value })}
                    placeholder="https://staging.example.com"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Production URL</label>
                  <input type="url" value={form.production_url || ''} onChange={e => setForm({ ...form, production_url: e.target.value })}
                    placeholder="https://www.example.com"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Preview Image URL</label>
                <input type="url" value={form.preview_image || ''} onChange={e => setForm({ ...form, preview_image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Hosting Plan</label>
                  <input type="text" value={form.hosting_plan || ''} onChange={e => setForm({ ...form, hosting_plan: e.target.value })}
                    placeholder="e.g., Standard Hosting"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Support Plan</label>
                  <input type="text" value={form.support_plan || ''} onChange={e => setForm({ ...form, support_plan: e.target.value })}
                    placeholder="e.g., Premium Support"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Launch Target Date</label>
                  <input type="date" value={form.launch_target_date || ''} onChange={e => setForm({ ...form, launch_target_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Live Date</label>
                  <input type="date" value={form.live_date || ''} onChange={e => setForm({ ...form, live_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.client_visible !== false}
                    onChange={e => setForm({ ...form, client_visible: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/30 cursor-pointer" />
                  <span className="text-xs text-slate-300">Visible to client</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured || false}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-white/5 text-[#8B5CF6] focus:ring-[#8B5CF6]/30 cursor-pointer" />
                  <span className="text-xs text-slate-300">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.client_staging_access || false}
                    onChange={e => setForm({ ...form, client_staging_access: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-white/5 text-[#F59E0B] focus:ring-[#F59E0B]/30 cursor-pointer" />
                  <span className="text-xs text-slate-300">Client staging access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.client_production_access || false}
                    onChange={e => setForm({ ...form, client_production_access: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-white/5 text-[#10B981] focus:ring-[#10B981]/30 cursor-pointer" />
                  <span className="text-xs text-slate-300">Client production access</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingId ? 'Save Changes' : 'Create Website'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
