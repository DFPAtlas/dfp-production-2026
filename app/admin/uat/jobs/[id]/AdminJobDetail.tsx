'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from '@/components/motion';
import {
  ArrowLeft, Edit, Save, Loader2, AlertCircle, Globe, Server, Users,
  Clock, DollarSign, Calendar, Monitor, Smartphone, CheckCircle, XCircle,
  UserCheck, UserX, MessageSquare,
} from 'lucide-react';
import AdminShell from '../../../../../components/admin/AdminShell';



interface UatJob {
  id: string; project_id: string | null; environment_id: string | null;
  title: string; description: string | null; public_summary: string | null;
  test_instructions: string | null; required_devices: string[] | null;
  required_browsers: string[] | null; required_experience_level: string | null;
  estimated_hours: number | null; pay_amount: number | null; pay_type: string;
  max_testers: number | null; deadline: string | null; status: string;
  created_at: string; updated_at: string;
  project_name?: string; environment_name?: string; base_url?: string;
  env_version?: string; env_build?: string;
}

interface Application {
  id: string; job_id: string; tester_id: string; status: string;
  application_message: string | null; admin_notes: string | null;
  created_at: string; tester_name?: string; tester_email?: string;
  tester_devices?: string[]; tester_browsers?: string[];
  tester_experience?: string;
}

const statusOptions = ['draft', 'open', 'in_testing', 'completed', 'closed'];

export default function AdminJobDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<UatJob | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UatJob>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [appNote, setAppNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    const { data: jobData } = await supabase.from('uat_jobs').select('*').eq('id', jobId).maybeSingle();
    if (!jobData) { setNotFound(true); setLoading(false); return; }

    const pId = jobData.project_id;
    const eId = jobData.environment_id;
    const [{ data: proj }, { data: env }] = await Promise.all([
      pId ? supabase.from('uat_projects').select('name').eq('id', pId).maybeSingle() : Promise.resolve({ data: null }),
      eId ? supabase.from('uat_environments').select('environment_name, base_url, version, current_build').eq('id', eId).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const merged = {
      ...jobData,
      project_name: proj?.name || null,
      environment_name: env?.environment_name || null,
      base_url: env?.base_url || null,
      env_version: env?.version || null,
      env_build: env?.current_build || null,
    };

    setJob(merged as UatJob);
    setForm(merged as UatJob);

    const { data: appData } = await supabase.from('uat_job_applications').select('*').eq('job_id', jobId).order('created_at', { ascending: true });

    if (appData && appData.length > 0) {
      const testerIds = [...new Set(appData.map((a: any) => a.tester_id))];
      const { data: testers } = await supabase.from('uat_testers').select('id, full_name, email, devices, browsers, experience_level').in('id', testerIds);
      const testerMap: Record<string, any> = {};
      testers?.forEach((t: any) => { testerMap[t.id] = t; });

      const mergedApps = appData.map((a: any) => ({
        ...a,
        tester_name: testerMap[a.tester_id]?.full_name || 'Unknown',
        tester_email: testerMap[a.tester_id]?.email || '',
        tester_devices: testerMap[a.tester_id]?.devices || [],
        tester_browsers: testerMap[a.tester_id]?.browsers || [],
        tester_experience: testerMap[a.tester_id]?.experience_level || '',
      }));
      setApplications(mergedApps);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { setError('Job title is required.'); return; }
    setSaving(true);
    const payload = {
      title: form.title, public_summary: form.public_summary, description: form.description,
      test_instructions: form.test_instructions, required_devices: form.required_devices,
      required_browsers: form.required_browsers, required_experience_level: form.required_experience_level,
      estimated_hours: form.estimated_hours, pay_amount: form.pay_amount, pay_type: form.pay_type,
      max_testers: form.max_testers, deadline: form.deadline, status: form.status,
      updated_at: new Date().toISOString(),
    };
    const { error: updateErr } = await supabase.from('uat_jobs').update(payload).eq('id', jobId);
    if (!updateErr) {
      await supabase.from('uat_audit_log').insert({ action: 'Job updated', entity_type: 'uat_job', entity_id: jobId, previous_value: job, new_value: payload });
      await fetchData();
      setEditing(false);
    } else { setError('Failed to save.'); }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await supabase.from('uat_jobs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', jobId);
    await supabase.from('uat_audit_log').insert({ action: `Job status changed to ${newStatus}`, entity_type: 'uat_job', entity_id: jobId, previous_value: { status: job?.status }, new_value: { status: newStatus } });
    fetchData();
  };

  const handleAppStatus = async (app: Application, newStatus: string) => {
    const noteVal = appNote[app.id] || '';
    await supabase.from('uat_job_applications').update({ status: newStatus, admin_notes: noteVal || null, updated_at: new Date().toISOString() }).eq('id', app.id);
    await supabase.from('uat_audit_log').insert({
      action: `Application ${newStatus}`,
      entity_type: 'uat_job_application',
      entity_id: app.id,
      previous_value: { status: app.status },
      new_value: { status: newStatus, admin_notes: noteVal },
    });

    if (newStatus === 'accepted') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await supabase.from('uat_assignments').insert({
        job_id: app.job_id,
        tester_id: app.tester_id,
        application_id: app.id,
        status: 'assigned',
        agreed_pay: job?.pay_amount || null,
        access_starts_at: new Date().toISOString(),
        access_expires_at: expiresAt.toISOString(),
        admin_notes: noteVal || null,
      });
      await supabase.from('uat_audit_log').insert({
        action: 'Assignment created',
        entity_type: 'uat_assignment',
        entity_id: app.job_id,
        new_value: { job_id: app.job_id, tester_id: app.tester_id, application_id: app.id },
      });
    }

    setAppNote((prev) => { const n = { ...prev }; delete n[app.id]; return n; });
    fetchData();
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (notFound || !job) {
    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
          <button onClick={() => router.push('/admin/uat/jobs')} className="px-5 py-2.5 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to Jobs</button>
        </div>
      </AdminShell>
    );
  }

  const sc = { draft: '#94A3B8', open: '#10B981', in_testing: '#06B6D4', completed: '#8B5CF6', closed: '#6B7280' }[job.status] || '#94A3B8';

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/admin/uat/jobs')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                  <textarea value={form.public_summary || ''} onChange={(e) => setForm({ ...form, public_summary: e.target.value })} rows={2}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium border capitalize" style={{ color: sc, borderColor: sc + '30', backgroundColor: sc + '15' }}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  {job.public_summary && <p className="text-sm text-slate-400 mb-3">{job.public_summary}</p>}
                  {job.description && <p className="text-sm text-slate-500 mb-3 leading-relaxed">{job.description}</p>}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setError(''); }} className="px-3 py-2 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-[#06B6D4] rounded-xl text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-[#06B6D4] cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
          </div>

          {editing && error && (
            <div className="px-6 pb-4"><div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-xs text-red-400">{error}</p></div></div>
          )}

          <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400"><Globe className="w-4 h-4 text-slate-500" />{job.project_name || 'No project'}</div>
              <div className="flex items-center gap-2 text-slate-400"><Server className="w-4 h-4 text-slate-500" />{job.environment_name || 'No environment'}</div>
              <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4 text-slate-500" />{job.estimated_hours ? `${job.estimated_hours}h` : '-'}</div>
              <div className="flex items-center gap-2 text-slate-400"><DollarSign className="w-4 h-4 text-slate-500" />{job.pay_amount ? `$${job.pay_amount} (${job.pay_type})` : '-'}</div>
              <div className="flex items-center gap-2 text-slate-400"><Calendar className="w-4 h-4 text-slate-500" />{job.deadline ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}</div>
              <div className="flex items-center gap-2 text-slate-400"><Users className="w-4 h-4 text-slate-500" />{applications.length}{job.max_testers ? ` / ${job.max_testers} testers` : ' applicants'}</div>
              <div className="flex items-center gap-2 text-slate-400"><Monitor className="w-4 h-4 text-slate-500" />{job.required_devices?.join(', ') || '-'}</div>
              <div className="flex items-center gap-2 text-slate-400"><Smartphone className="w-4 h-4 text-slate-500" />{job.required_browsers?.join(', ') || '-'}</div>
            </div>

            {job.base_url && (
              <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex items-center gap-2 text-xs">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <a href={job.base_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{job.base_url}</a>
                {job.env_version && <span className="text-slate-500">v{job.env_version}</span>}
                {job.env_build && <span className="text-slate-500 font-mono">{job.env_build}</span>}
              </div>
            )}
          </div>

          {editing && (
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)] space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Private Test Instructions</label>
                <textarea value={form.test_instructions || ''} onChange={(e) => setForm({ ...form, test_instructions: e.target.value })} rows={4} maxLength={500}
                  className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, status: s })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border capitalize cursor-pointer"
                      style={{
                        color: form.status === s ? '#06B6D4' : '#94A3B8',
                        borderColor: form.status === s ? '#06B6D4' + '40' : 'rgba(255,255,255,0.08)',
                        backgroundColor: form.status === s ? '#06B6D4' + '15' : 'transparent',
                      }}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {job.test_instructions && !editing && (
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Test Instructions</h3>
              <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">{job.test_instructions}</pre>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Applications</h2>
                <p className="text-xs text-slate-400 mt-0.5">{applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
              </div>
              {job.status !== 'draft' && job.status !== 'closed' && (
                <div className="flex gap-2">
                  {job.status === 'open' && (
                    <button onClick={() => handleStatusChange('in_testing')} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 cursor-pointer whitespace-nowrap">Start Testing</button>
                  )}
                  {job.status === 'in_testing' && (
                    <button onClick={() => handleStatusChange('completed')} className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-400 hover:bg-violet-500/20 cursor-pointer whitespace-nowrap">Mark Complete</button>
                  )}
                  <button onClick={() => handleStatusChange('closed')} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 cursor-pointer whitespace-nowrap">Close Job</button>
                </div>
              )}
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.01] border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No applications yet</p>
                <p className="text-sm text-slate-500 mt-1">Applications will appear here when testers apply</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{app.tester_name}</p>
                        <p className="text-xs text-slate-500">{app.tester_email}</p>
                        {app.tester_experience && <p className="text-xs text-slate-500 mt-0.5">Experience: {app.tester_experience} · Devices: {(app.tester_devices || []).join(', ') || '-'}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                        app.status === 'applied' ? 'text-blue-400 bg-blue-400/10' :
                        app.status === 'accepted' ? 'text-emerald-400 bg-emerald-400/10' :
                        app.status === 'rejected' ? 'text-red-400 bg-red-400/10' :
                        'text-slate-400 bg-slate-400/10'
                      }`}>{app.status}</span>
                    </div>

                    {app.application_message && (
                      <p className="text-sm text-slate-400 mb-3 italic">“{app.application_message}”</p>
                    )}
                    {app.admin_notes && (
                      <p className="text-xs text-slate-500 mb-2">Admin note: {app.admin_notes}</p>
                    )}

                    {app.status === 'applied' && (
                      <div className="flex gap-2 mt-2">
                        <input type="text" value={appNote[app.id] || ''} onChange={(e) => setAppNote({ ...appNote, [app.id]: e.target.value })}
                          placeholder="Add a note..."
                          className="flex-1 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/20" />
                        <button onClick={() => handleAppStatus(app, 'accepted')} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/20 cursor-pointer flex items-center gap-1 whitespace-nowrap">
                          <UserCheck className="w-3 h-3" /> Accept
                        </button>
                        <button onClick={() => handleAppStatus(app, 'rejected')} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 cursor-pointer flex items-center gap-1 whitespace-nowrap">
                          <UserX className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
