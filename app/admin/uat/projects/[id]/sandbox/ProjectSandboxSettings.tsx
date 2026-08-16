'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle, Settings, Box, Shield, Database, Activity } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { SANDBOX_MODES, SANDBOX_MODE_CONFIG } from '@/lib/uat-sandbox/types';

interface SandboxSettingsData {
  id?: string;
  project_id: string;
  environment_id: string | null;
  sandbox_enabled: boolean;
  sandbox_mode: string;
  base_environment_url: string;
  allowed_origins: string[];
  allowed_external_domains: string[];
  blocked_domains: string[];
  temporary_account_enabled: boolean;
  seed_data_enabled: boolean;
  reset_enabled: boolean;
  rebuild_enabled: boolean;
  email_interception_enabled: boolean;
  sms_interception_enabled: boolean;
  payment_test_mode_required: boolean;
  external_webhooks_blocked: boolean;
  downloads_allowed: boolean;
  uploads_allowed: boolean;
  session_duration_minutes: number;
  maximum_extension_minutes: number;
  cleanup_after_session: boolean;
}

export default function ProjectSandboxSettings({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [project, setProject] = useState<any>(null);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [settings, setSettings] = useState<SandboxSettingsData>({
    project_id: projectId,
    environment_id: null,
    sandbox_enabled: false,
    sandbox_mode: 'shared_staging',
    base_environment_url: '',
    allowed_origins: [],
    allowed_external_domains: [],
    blocked_domains: [],
    temporary_account_enabled: true,
    seed_data_enabled: true,
    reset_enabled: true,
    rebuild_enabled: false,
    email_interception_enabled: true,
    sms_interception_enabled: true,
    payment_test_mode_required: true,
    external_webhooks_blocked: true,
    downloads_allowed: true,
    uploads_allowed: true,
    session_duration_minutes: 120,
    maximum_extension_minutes: 60,
    cleanup_after_session: true,
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const { data: proj } = await supabase.from('uat_projects').select('name').eq('id', projectId).maybeSingle();
    if (!proj) { setLoading(false); return; }
    setProject(proj);

    const { data: envs } = await supabase.from('uat_environments').select('id, environment_name').eq('project_id', projectId).order('created_at');
    setEnvironments(envs || []);

    const { data: s } = await supabase.from('uat_sandbox_settings').select('*').eq('project_id', projectId).maybeSingle();
    if (s) {
      setSettings({
        ...s,
        base_environment_url: s.base_environment_url || '',
        allowed_origins: s.allowed_origins || [],
        allowed_external_domains: s.allowed_external_domains || [],
        blocked_domains: s.blocked_domains || [],
      } as SandboxSettingsData);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');

    const payload = {
      project_id: projectId,
      environment_id: settings.environment_id || null,
      sandbox_enabled: settings.sandbox_enabled,
      sandbox_mode: settings.sandbox_mode,
      base_environment_url: settings.base_environment_url || null,
      allowed_origins: settings.allowed_origins,
      allowed_external_domains: settings.allowed_external_domains,
      blocked_domains: settings.blocked_domains,
      temporary_account_enabled: settings.temporary_account_enabled,
      seed_data_enabled: settings.seed_data_enabled,
      reset_enabled: settings.reset_enabled,
      rebuild_enabled: settings.rebuild_enabled,
      email_interception_enabled: settings.email_interception_enabled,
      sms_interception_enabled: settings.sms_interception_enabled,
      payment_test_mode_required: settings.payment_test_mode_required,
      external_webhooks_blocked: settings.external_webhooks_blocked,
      downloads_allowed: settings.downloads_allowed,
      uploads_allowed: settings.uploads_allowed,
      session_duration_minutes: settings.session_duration_minutes,
      maximum_extension_minutes: settings.maximum_extension_minutes,
      cleanup_after_session: settings.cleanup_after_session,
      updated_at: new Date().toISOString(),
    };

    if (settings.id) {
      const { error: err } = await supabase.from('uat_sandbox_settings').update(payload).eq('id', settings.id);
      if (err) { setError('Failed to save: ' + err.message); } else { setSuccessMsg('Settings saved'); }
    } else {
      const { error: err } = await supabase.from('uat_sandbox_settings').insert({ ...payload, created_at: new Date().toISOString() });
      if (err) { setError('Failed to save: ' + err.message); } else {
        setSuccessMsg('Settings created');
        loadData();
      }
    }

    await supabase.from('uat_audit_log').insert({
      action: 'sandbox_settings_updated',
      entity_type: 'uat_sandbox_settings',
      entity_id: settings.id || projectId,
      new_value: { sandbox_enabled: settings.sandbox_enabled, sandbox_mode: settings.sandbox_mode },
    });

    setSaving(false);
    setTimeout(() => setSuccessMsg(''), 3000);
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

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push(`/admin/uat/projects/${projectId}`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </button>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-[#06B6D4]" />
                Sandbox Settings
              </h1>
              <p className="text-sm text-slate-400 mt-1">{project?.name}</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer flex items-center gap-2 disabled:opacity-60 whitespace-nowrap transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>

          {successMsg && (
            <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
              <i className="ri-check-line text-emerald-400" /> <span className="text-sm text-emerald-400">{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" /> <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <div className="p-6 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-[#06B6D4]" /> General
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.sandbox_enabled}
                      onChange={(e) => setSettings({ ...settings, sandbox_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                    <span className="text-sm text-slate-300">Enable Sandbox</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Sandbox Mode</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SANDBOX_MODES.map((mode) => {
                      const mc = SANDBOX_MODE_CONFIG[mode];
                      return (
                        <button key={mode} onClick={() => settings.sandbox_enabled && setSettings({ ...settings, sandbox_mode: mode })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${!mc.available ? 'opacity-40 cursor-not-allowed' : ''} ${
                            settings.sandbox_mode === mode
                              ? 'text-white border-[#06B6D4]/40 bg-[#06B6D4]/15'
                              : 'text-slate-400 border-[rgba(255,255,255,0.08)] hover:text-white'
                          }`}>
                          {mc.label}
                          {!mc.available && <span className="ml-1 text-[10px]">—</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Environment</label>
                  <div className="relative">
                    <i className="ri-server-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                    <select value={settings.environment_id || ''}
                      onChange={(e) => setSettings({ ...settings, environment_id: e.target.value || null })}
                      className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                      <option value="">All Environments</option>
                      {environments.map((env) => (
                        <option key={env.id} value={env.id}>{env.environment_name}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Base Environment URL</label>
                  <input type="url" value={settings.base_environment_url}
                    onChange={(e) => setSettings({ ...settings, base_environment_url: e.target.value })}
                    placeholder="https://test-website.example.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Session Duration (minutes)</label>
                  <input type="number" value={settings.session_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, session_duration_minutes: parseInt(e.target.value) || 120 })}
                    min={15} max={480}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Maximum Extension (minutes)</label>
                  <input type="number" value={settings.maximum_extension_minutes}
                    onChange={(e) => setSettings({ ...settings, maximum_extension_minutes: parseInt(e.target.value) || 60 })}
                    min={0} max={240}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                </div>
                <div>
                  <label className="flex items-center gap-3 pt-5 cursor-pointer">
                    <input type="checkbox" checked={settings.cleanup_after_session}
                      onChange={(e) => setSettings({ ...settings, cleanup_after_session: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                    <span className="text-sm text-slate-300">Cleanup after session</span>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#06B6D4]" /> Access Controls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Allowed Origins (one per line)</label>
                  <textarea value={settings.allowed_origins.join('\n')}
                    onChange={(e) => setSettings({ ...settings, allowed_origins: e.target.value.split('\n').filter(Boolean) })}
                    rows={3}
                    placeholder="https://test-website.example.com"
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Allowed External Domains (one per line)</label>
                  <textarea value={settings.allowed_external_domains.join('\n')}
                    onChange={(e) => setSettings({ ...settings, allowed_external_domains: e.target.value.split('\n').filter(Boolean) })}
                    rows={3}
                    placeholder="api.example.com"
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Blocked Domains (one per line)</label>
                  <textarea value={settings.blocked_domains.join('\n')}
                    onChange={(e) => setSettings({ ...settings, blocked_domains: e.target.value.split('\n').filter(Boolean) })}
                    rows={3}
                    placeholder="blocked-service.example.com"
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none font-mono" />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.downloads_allowed}
                      onChange={(e) => setSettings({ ...settings, downloads_allowed: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                    <span className="text-sm text-slate-300">Downloads allowed</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.uploads_allowed}
                      onChange={(e) => setSettings({ ...settings, uploads_allowed: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                    <span className="text-sm text-slate-300">Uploads allowed</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.external_webhooks_blocked}
                      onChange={(e) => setSettings({ ...settings, external_webhooks_blocked: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                    <span className="text-sm text-slate-300">External webhooks blocked</span>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#06B6D4]" /> Test Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.temporary_account_enabled}
                    onChange={(e) => setSettings({ ...settings, temporary_account_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                  <span className="text-sm text-slate-300">Temporary accounts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.seed_data_enabled}
                    onChange={(e) => setSettings({ ...settings, seed_data_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                  <span className="text-sm text-slate-300">Seeded test data</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.reset_enabled}
                    onChange={(e) => setSettings({ ...settings, reset_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                  <span className="text-sm text-slate-300">Reset enabled</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.email_interception_enabled}
                    onChange={(e) => setSettings({ ...settings, email_interception_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                  <span className="text-sm text-slate-300">Email interception</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.sms_interception_enabled}
                    onChange={(e) => setSettings({ ...settings, sms_interception_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                  <span className="text-sm text-slate-300">SMS interception</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.payment_test_mode_required}
                    onChange={(e) => setSettings({ ...settings, payment_test_mode_required: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer" />
                  <span className="text-sm text-slate-300">Payment test mode required</span>
                </label>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#06B6D4]" /> Health
              </h2>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Settings</span>
                    <p className="text-white font-medium">{settings.sandbox_enabled ? 'Configured' : 'Not configured'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Mode</span>
                    <p className="text-white font-medium">{SANDBOX_MODE_CONFIG[settings.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.label || settings.sandbox_mode}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Mode Available</span>
                    <p className={`font-medium ${SANDBOX_MODE_CONFIG[settings.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.available ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {SANDBOX_MODE_CONFIG[settings.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.available ? 'Yes' : 'Unavailable'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Adapter</span>
                    <p className="text-white font-medium">Shared Staging</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}