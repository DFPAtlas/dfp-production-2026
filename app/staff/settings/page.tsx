'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  User, Shield, Mail, Phone, Save, Loader2,
  CheckCircle, LogOut, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StaffShell from '../../../components/staff/StaffShell';



export default function StaffSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
  });

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }

      const { data: sp } = await supabase.from('staff_profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }

      setProfile({
        full_name: sp.full_name || session.user.user_metadata?.full_name || '',
        email: sp.email || session.user.email || '',
        phone: sp.phone || '',
        role: sp.role || 'project_lead',
      });
      setLoading(false);
    }
    init();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('staff_profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
      updated_at: new Date().toISOString(),
    }).eq('id', session.user.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTimeout(() => router.replace('/staff/login'), 0);
  };

  if (loading) {
    return (
      <StaffShell>
        <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" /></div>
      </StaffShell>
    );
  }

  const roleLabel = profile.role === 'super_admin' ? 'Super Admin' :
    profile.role === 'admin' ? 'Admin' :
    profile.role === 'project_lead' ? 'Project Lead' :
    profile.role === 'developer' ? 'Developer' : 'Support';

  const roleColor = profile.role === 'super_admin' ? '#EF4444' :
    profile.role === 'admin' ? '#2563EB' :
    profile.role === 'project_lead' ? '#8B5CF6' :
    profile.role === 'developer' ? '#10B981' : '#F59E0B';

  return (
    <StaffShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your staff profile</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#06B6D4] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#06B6D4]/20">
                {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DF'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{profile.full_name || 'Staff Member'}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border mt-1"
                  style={{ backgroundColor: `${roleColor}10`, color: roleColor, borderColor: `${roleColor}20` }}>
                  <Shield className="w-3 h-3" /> {roleLabel}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={profile.email} disabled
                    className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-500 cursor-not-allowed" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact an administrator.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+44 20 XXXX XXXX"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all" />
                </div>
              </div>
            </div>

            {saved && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4" /> Profile saved successfully
              </motion.div>
            )}

            <button onClick={handleSave} disabled={saving}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-4">Sign out of the staff portal. You will need to log in again to access.</p>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#EF4444]/20 rounded-xl text-sm font-semibold text-[#EF4444] hover:bg-[#EF4444]/5 transition-all cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}