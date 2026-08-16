'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle, Globe, Server } from 'lucide-react';
import AdminShell from '../../../../../components/admin/AdminShell';



interface UatProject { id: string; name: string; }
interface UatEnvironment { id: string; project_id: string; environment_name: string; environment_type: string; base_url: string; version: string | null; current_build: string | null; }

export default function NewJobPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<UatProject[]>([]);
  const [environments, setEnvironments] = useState<UatEnvironment[]>([]);
  const [projectId, setProjectId] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [title, setTitle] = useState('');
  const [publicSummary, setPublicSummary] = useState('');
  const [description, setDescription] = useState('');
  const [testInstructions, setTestInstructions] = useState('');
  const [requiredDevices, setRequiredDevices] = useState<string[]>([]);
  const [requiredBrowsers, setRequiredBrowsers] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('fixed');
  const [maxTesters, setMaxTesters] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdJobId, setCreatedJobId] = useState('');

  const selectedEnv = environments.find((e) => e.id === environmentId);

  useEffect(() => {
    supabase.from('uat_projects').select('id, name').order('name').then(({ data }) => setProjects((data as UatProject[]) || []));
  }, []);

  useEffect(() => {
    if (!projectId) { setEnvironments([]); setEnvironmentId(''); return; }
    supabase.from('uat_environments').select('id, project_id, environment_name, environment_type, base_url, version, current_build').eq('project_id', projectId).eq('is_active', true).then(({ data }) => {
      setEnvironments((data as UatEnvironment[]) || []);
      setEnvironmentId('');
    });
  }, [projectId]);

  const deviceOptions = ['Desktop', 'iPhone', 'Android Phone', 'iPad', 'Android Tablet', 'MacBook', 'Windows Laptop'];
  const browserOptions = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Samsung Internet'];
  const experienceOptions = ['beginner', 'intermediate', 'advanced'];

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Job title is required.'); return; }
    if (!projectId) { setError('Please select a project.'); return; }

    setSaving(true);
    setError('');

    const payload = {
      project_id: projectId || null,
      environment_id: environmentId || null,
      title: title.trim(),
      public_summary: publicSummary.trim() || null,
      description: description.trim() || null,
      test_instructions: testInstructions.trim() || null,
      required_devices: requiredDevices.length > 0 ? requiredDevices : null,
      required_browsers: requiredBrowsers.length > 0 ? requiredBrowsers : null,
      required_experience_level: experienceLevel || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      pay_amount: payAmount ? parseFloat(payAmount) : null,
      pay_type: payType,
      max_testers: maxTesters ? parseInt(maxTesters) : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
    };

    const { data, error: insertErr } = await supabase.from('uat_jobs').insert(payload).select('id').single();
    if (insertErr) { setError('Failed to create job. Please try again.'); setSaving(false); return; }

    await supabase.from('uat_audit_log').insert({
      action: 'Job created',
      entity_type: 'uat_job',
      entity_id: data.id,
      new_value: payload,
    });

    setCreatedJobId(data.id);
    setSuccess(true);
    setSaving(false);
  };

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/admin/uat/jobs')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">Post New UAT Job</h1>
        <p className="text-sm text-slate-400 mb-8">Create a test job linked to a registered project and environment</p>

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Job Posted</h3>
            <p className="text-slate-400 mb-6">The job has been created successfully.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => router.push(`/admin/uat/jobs/${createdJobId}`)} className="px-5 py-2.5 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">View Job</button>
              <button onClick={() => { setSuccess(false); setTitle(''); setPublicSummary(''); setDescription(''); setTestInstructions(''); setRequiredDevices([]); setRequiredBrowsers([]); setEstimatedHours(''); setPayAmount(''); setMaxTesters(''); setDeadline(''); }} className="px-5 py-2.5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Post Another</button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project *</label>
                <div className="relative">
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                    className="w-full pl-4 pr-8 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                    <option value="">Select a project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Environment</label>
                <div className="relative">
                  <select value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)}
                    className="w-full pl-4 pr-8 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                    disabled={!projectId}>
                    <option value="">Select environment (optional)</option>
                    {environments.map((e) => <option key={e.id} value={e.id}>{e.environment_name} ({e.environment_type})</option>)}
                  </select>
                </div>
              </div>
            </div>

            {selectedEnv && (
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">{selectedEnv.base_url}</span>
                </div>
                {selectedEnv.version && <p className="text-xs text-slate-500">Version: {selectedEnv.version}{selectedEnv.current_build ? ` · Build: ${selectedEnv.current_build}` : ''}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. QuickGuard Staff Booking Flow"
                className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Public Summary</label>
              <textarea value={publicSummary} onChange={(e) => setPublicSummary(e.target.value)} rows={2} maxLength={300}
                placeholder="Brief public summary testers will see on the job board..."
                className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Description (Internal)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500}
                placeholder="Detailed description for admin/tester reference..."
                className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Private Test Instructions</label>
              <textarea value={testInstructions} onChange={(e) => setTestInstructions(e.target.value)} rows={4} maxLength={500}
                placeholder="Step-by-step test instructions (only visible to assigned testers)..."
                className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Required Devices</label>
              <div className="flex flex-wrap gap-2">
                {deviceOptions.map((d) => (
                  <button key={d} type="button" onClick={() => toggleItem(d, requiredDevices, setRequiredDevices)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                    style={{
                      color: requiredDevices.includes(d) ? '#06B6D4' : '#94A3B8',
                      borderColor: requiredDevices.includes(d) ? '#06B6D4' + '40' : 'rgba(255,255,255,0.08)',
                      backgroundColor: requiredDevices.includes(d) ? '#06B6D4' + '15' : 'transparent',
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Required Browsers</label>
              <div className="flex flex-wrap gap-2">
                {browserOptions.map((b) => (
                  <button key={b} type="button" onClick={() => toggleItem(b, requiredBrowsers, setRequiredBrowsers)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                    style={{
                      color: requiredBrowsers.includes(b) ? '#F59E0B' : '#94A3B8',
                      borderColor: requiredBrowsers.includes(b) ? '#F59E0B' + '40' : 'rgba(255,255,255,0.08)',
                      backgroundColor: requiredBrowsers.includes(b) ? '#F59E0B' + '15' : 'transparent',
                    }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Required Experience Level</label>
              <div className="flex gap-2">
                {experienceOptions.map((lvl) => (
                  <button key={lvl} type="button" onClick={() => setExperienceLevel(lvl)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer capitalize"
                    style={{
                      color: experienceLevel === lvl ? '#06B6D4' : '#94A3B8',
                      borderColor: experienceLevel === lvl ? '#06B6D4' + '40' : 'rgba(255,255,255,0.08)',
                      backgroundColor: experienceLevel === lvl ? '#06B6D4' + '15' : 'transparent',
                    }}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Hours</label>
                <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} min="0" step="0.5" placeholder="e.g. 3.5"
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pay Type</label>
                <div className="relative">
                  <select value={payType} onChange={(e) => setPayType(e.target.value)}
                    className="w-full pl-4 pr-8 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                    <option value="fixed">Fixed Rate</option>
                    <option value="hourly">Per Hour</option>
                    <option value="bonus-only">Bonus Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pay Amount ($)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="0" step="1" placeholder="e.g. 75"
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Testers</label>
                <input type="number" value={maxTesters} onChange={(e) => setMaxTesters(e.target.value)} min="1" placeholder="e.g. 5"
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all color-scheme-dark" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <div className="flex gap-2">
                {[{ value: 'draft', label: 'Draft', color: '#94A3B8' }, { value: 'open', label: 'Open', color: '#10B981' }].map((s) => (
                  <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer"
                    style={{
                      color: status === s.value ? s.color : '#94A3B8',
                      borderColor: status === s.value ? s.color + '40' : 'rgba(255,255,255,0.08)',
                      backgroundColor: status === s.value ? s.color + '15' : 'transparent',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push('/admin/uat/jobs')} className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {status === 'open' ? 'Post Job' : 'Save as Draft'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}