'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import { motion } from '@/components/motion';
import { Bell, Clock, Save, ArrowLeft } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';

export default function NotificationPreferences() {
  const { profile } = useAdminProfile();
  const [prefs, setPrefs] = useState({
    in_app_enabled: true,
    email_enabled: false,
    sms_enabled: false,
    digest_enabled: false,
    digest_frequency: 'daily' as 'daily' | 'weekly',
    quiet_hours_enabled: false,
    quiet_start: '22:00',
    quiet_end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    categories: {
      assignment: true, mention: true, approval: true, deadline: true,
      client: true, project: true, task: true, finance: true,
      operations: true, automation: true, uat: true, pbx: false,
      content: false, security: true, system: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }

    const stored = localStorage.getItem(`notif_prefs_${profile.id}`);
    if (stored) {
      try { setPrefs((p) => ({ ...p, ...JSON.parse(stored) })); } catch {}
    }

    supabase
      .from('user_settings')
      .select('notifications_enabled, email_notifications, notification_email')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs((p) => ({
            ...p,
            in_app_enabled: data.notifications_enabled ?? true,
            email_enabled: data.email_notifications ?? false,
          }));
        }
        setLoading(false);
      });
  }, [profile?.id]);

  const toggleCategory = (cat: string) => {
    setPrefs((p) => ({
      ...p,
      categories: { ...p.categories, [cat]: !(p.categories as Record<string, boolean>)[cat] },
    }));
  };

  const save = async () => {
    if (!profile?.id) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    localStorage.setItem(`notif_prefs_${profile.id}`, JSON.stringify(prefs));

    const { error: updateErr } = await supabase
      .from('user_settings')
      .upsert({
        user_id: profile.id,
        notifications_enabled: prefs.in_app_enabled,
        email_notifications: prefs.email_enabled,
      }, { onConflict: 'user_id' });

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminShell>
      <div className="space-y-4 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/[0.02] rounded-xl animate-pulse" />
        ))}
      </div>
      </AdminShell>
    );
  }

  const categories = [
    { key: 'assignment', label: 'Assignments' },
    { key: 'mention', label: 'Mentions' },
    { key: 'approval', label: 'Approvals' },
    { key: 'deadline', label: 'Deadlines' },
    { key: 'client', label: 'Clients' },
    { key: 'project', label: 'Projects' },
    { key: 'task', label: 'Tasks' },
    { key: 'finance', label: 'Finance' },
    { key: 'operations', label: 'Operations' },
    { key: 'automation', label: 'Automations' },
    { key: 'uat', label: 'UAT' },
    { key: 'pbx', label: 'PBX' },
    { key: 'content', label: 'Content' },
    { key: 'security', label: 'Security' },
    { key: 'system', label: 'System' },
  ];

  return (
    <AdminShell>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <Link href="/admin/notifications" className="text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer whitespace-nowrap">
          Notifications
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300">Preferences</span>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold text-white">Notification Preferences</h1>
        <p className="text-sm text-slate-400 mt-1">Choose which notifications you want to receive and how</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#06B6D4]" /> Delivery Channels
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-300">In-app notifications</span>
              <button onClick={() => setPrefs((p) => ({ ...p, in_app_enabled: !p.in_app_enabled }))} className={`w-10 h-6 rounded-full transition-colors ${prefs.in_app_enabled ? 'bg-[#06B6D4]' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.in_app_enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm text-slate-300">Email notifications</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Requires Resend configuration</p>
              </div>
              <button onClick={() => setPrefs((p) => ({ ...p, email_enabled: !p.email_enabled }))} className={`w-10 h-6 rounded-full transition-colors ${prefs.email_enabled ? 'bg-[#06B6D4]' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.email_enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm text-slate-300">Digest emails</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Batched summary of notifications</p>
              </div>
              <button onClick={() => setPrefs((p) => ({ ...p, digest_enabled: !p.digest_enabled }))} className={`w-10 h-6 rounded-full transition-colors ${prefs.digest_enabled ? 'bg-[#06B6D4]' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.digest_enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </label>

            {prefs.digest_enabled && (
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs text-slate-500">Frequency:</span>
                <select value={prefs.digest_frequency} onChange={(e) => setPrefs((p) => ({ ...p, digest_frequency: e.target.value as 'daily' | 'weekly' }))} className="px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer focus:outline-none appearance-none pr-6">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#06B6D4]" /> Quiet Hours
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-300">Enable quiet hours</span>
              <button onClick={() => setPrefs((p) => ({ ...p, quiet_hours_enabled: !p.quiet_hours_enabled }))} className={`w-10 h-6 rounded-full transition-colors ${prefs.quiet_hours_enabled ? 'bg-[#06B6D4]' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs.quiet_hours_enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </button>
            </label>

            {prefs.quiet_hours_enabled && (
              <div className="flex items-center gap-3 pl-2">
                <input type="time" value={prefs.quiet_start} onChange={(e) => setPrefs((p) => ({ ...p, quiet_start: e.target.value }))} className="px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:border-[#06B6D4]/40" />
                <span className="text-xs text-slate-500">to</span>
                <input type="time" value={prefs.quiet_end} onChange={(e) => setPrefs((p) => ({ ...p, quiet_end: e.target.value }))} className="px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:border-[#06B6D4]/40" />
              </div>
            )}

            <div className="flex items-center gap-2 pl-2">
              <span className="text-xs text-slate-500">Timezone:</span>
              <span className="text-xs text-slate-300">{prefs.timezone}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Category Preferences</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => toggleCategory(cat.key)}
              className={`px-4 py-2.5 rounded-xl text-xs text-left border transition-all cursor-pointer whitespace-nowrap ${(prefs.categories as Record<string, boolean>)[cat.key] ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/[0.02] border-[rgba(255,255,255,0.05)] text-slate-500 hover:border-[rgba(255,255,255,0.1)]'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] hover:bg-[#08C4E4] rounded-xl text-sm font-medium text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saved && <span className="text-xs text-green-400">Preferences saved</span>}
      </div>
    </div>
    </AdminShell>
  );
}

