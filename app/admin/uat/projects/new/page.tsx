'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertCircle, Loader2, Save } from 'lucide-react';
import AdminShell from '../../../../../components/admin/AdminShell';



const statusOptions = ['active', 'paused', 'archived'];

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [description, setDescription] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setSaving(true);
    setError('');

    const { data, error: insertError } = await supabase
      .from('uat_projects')
      .insert({
        name: name.trim(),
        client_company: clientCompany.trim() || null,
        description: description.trim() || null,
        live_url: liveUrl.trim() || null,
        status,
      })
      .select('id')
      .single();

    if (insertError || !data) {
      setError('Failed to create project. Please try again.');
      setSaving(false);
      return;
    }

    await supabase.from('uat_audit_log').insert({
      action: 'Project created',
      entity_type: 'uat_project',
      entity_id: data.id,
      new_value: { name, client_company: clientCompany, description, live_url: liveUrl, status },
    });

    router.push(`/admin/uat/projects/${data.id}`);
  };

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/admin/uat/projects')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">New UAT Project</h1>
        <p className="text-sm text-slate-400 mb-8">Register a new test project for UAT testing.</p>

        <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Digital Footprint" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Client / Company</label>
            <input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Client name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" placeholder="Brief description of the project." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Live URL</label>
            <input type="url" value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="https://example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40">
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button type="submit" disabled={saving} className="w-full px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Project
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
