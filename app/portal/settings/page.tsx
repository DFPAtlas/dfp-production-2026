'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { User, Mail, Building2, Shield, CheckCircle, Loader2 } from 'lucide-react';
import PortalShell from '../PortalShell';



export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setEmail(session.user.email ?? '');
      setFullName(session.user.user_metadata?.full_name || '');
      setCompany(session.user.user_metadata?.company || '');
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (data) { if (data.full_name) setFullName(data.full_name); if (data.company) setCompany(data.company); }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error: profileError } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: fullName, company, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (profileError) { setError('Failed to save profile.'); setSaving(false); return; }
    await supabase.auth.updateUser({ data: { full_name: fullName, company } });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your profile and preferences</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#06B6D4]/10">
              <User className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profile Information</h2>
              <p className="text-sm text-slate-400">Update your account details</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} disabled className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-500 cursor-not-allowed" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Contact your account manager to change your email</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Enter your company name"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] transition-all" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">
              <Shield className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Security</h2>
              <p className="text-sm text-slate-400">Your account uses password-free magic link authentication</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Secure Magic Link Login</p>
                <p className="text-xs text-slate-400 mt-0.5">Each login sends a unique, one-time link to your email. No passwords to remember or compromise.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center justify-between">
          <div>
            {saved && <p className="text-sm text-[#10B981] font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />Profile saved successfully</p>}
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            {!saved && !error && <p className="text-sm text-slate-400">Make sure to save your changes</p>}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold text-sm rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </motion.div>
      </div>
    </PortalShell>
  );
}