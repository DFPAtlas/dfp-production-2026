'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import AdminShell from '../../../components/admin/AdminShell';
import { useRouter } from 'next/navigation';



type Founder = {
  id: number;
  name: string;
  role: string;
  bio: string;
  bio_paragraph_2: string;
  image_url: string;
  skills: string[];
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  image_url: string;
  section: string;
  sort_order: number;
};

const SECTIONS = [
  { key: 'conception', label: 'Conception', color: '#F97316' },
  { key: 'development', label: 'Development', color: '#7C3AED' },
  { key: 'deployment', label: 'Deployment', color: '#10B981' },
];

export default function AboutContentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'founder' | 'conception' | 'development' | 'deployment'>('founder');
  const [founder, setFounder] = useState<Founder | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [newMemberSection, setNewMemberSection] = useState<string>('conception');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '', role: '', bio: '', skills: [], image_url: '', section: 'conception', sort_order: 0,
  });
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (redirectTo) {
      const timer = setTimeout(() => {
        router.replace(redirectTo);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (!session) { if (!cancelled) setRedirectTo('/admin/login'); return; }
      const { data: ap } = await supabase.from('admin_profiles').select('id').eq('id', session.user.id).maybeSingle();
      if (cancelled) return;
      if (!ap) { await supabase.auth.signOut(); if (!cancelled) setRedirectTo('/admin/login'); return; }
      fetchData();
    });
    return () => { cancelled = true; };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: fData }, { data: tData }] = await Promise.all([
      supabase.from('about_founder').select('id, name, title, bio, image_url, linkedin_url, twitter_url, sort_order, created_at, updated_at').maybeSingle(),
      supabase.from('about_team_members').select('id, name, title, bio, image_url, linkedin_url, twitter_url, sort_order, created_at').order('sort_order'),
    ]);
    if (fData) setFounder(fData as Founder);
    if (tData) setTeam(tData as TeamMember[]);
    setLoading(false);
  };

  const saveFounder = async () => {
    if (!founder) return;
    setSaving(true);
    const { error } = await supabase.from('about_founder').update({
      name: founder.name,
      role: founder.role,
      bio: founder.bio,
      bio_paragraph_2: founder.bio_paragraph_2,
      image_url: founder.image_url,
      skills: founder.skills,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else showToast('Founder info saved successfully', 'success');
  };

  const saveTeamMember = async (member: TeamMember) => {
    setSaving(true);
    const { error } = await supabase.from('about_team_members').update({
      name: member.name,
      role: member.role,
      bio: member.bio,
      skills: member.skills,
      image_url: member.image_url,
      section: member.section,
      sort_order: member.sort_order,
      updated_at: new Date().toISOString(),
    }).eq('id', member.id);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else { showToast('Team member saved', 'success'); setEditingTeamMember(null); fetchData(); }
  };

  const addTeamMember = async () => {
    if (!newMember.name || !newMember.role) return;
    setSaving(true);
    const { error } = await supabase.from('about_team_members').insert({
      name: newMember.name,
      role: newMember.role,
      bio: newMember.bio || '',
      skills: newMember.skills || [],
      image_url: newMember.image_url || '',
      section: newMember.section || 'conception',
      sort_order: newMember.sort_order || 0,
    });
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else {
      showToast('Team member added', 'success');
      setShowAddForm(false);
      setNewMember({ name: '', role: '', bio: '', skills: [], image_url: '', section: 'conception', sort_order: 0 });
      fetchData();
    }
  };

  const deleteTeamMember = async (id: number) => {
    if (!confirm('Delete this team member?')) return;
    setSaving(true);
    const { error } = await supabase.from('about_team_members').delete().eq('id', id);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else { showToast('Deleted', 'success'); setEditingTeamMember(null); fetchData(); }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentSection = SECTIONS.find(s => s.key === activeTab);
  const currentTeam = team.filter(m => m.section === activeTab).sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return (
      <AdminShell>
        <div className="max-w-5xl mx-auto flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">About Page Content</h1>
          <p className="text-slate-400 text-sm">Edit the founder section and team members displayed on the About page.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1E293B] p-1 rounded-xl border border-[rgba(255,255,255,0.08)]">
          {[
            { key: 'founder', label: 'Founder', color: '#06B6D4' },
            { key: 'conception', label: 'Conception', color: '#F97316' },
            { key: 'development', label: 'Development', color: '#7C3AED' },
            { key: 'deployment', label: 'Deployment', color: '#10B981' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setEditingTeamMember(null); setShowAddForm(false); }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: tab.color }} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'founder' && founder && (
            <motion.div key="founder" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Founder Profile</h2>
                  <button onClick={saveFounder} disabled={saving} className="px-4 py-2 rounded-xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 text-sm font-medium hover:bg-[#06B6D4]/20 transition-colors cursor-pointer disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                      <input value={founder.name} onChange={e => setFounder({ ...founder, name: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                      <input value={founder.role} onChange={e => setFounder({ ...founder, role: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Image URL</label>
                      <input value={founder.image_url || ''} onChange={e => setFounder({ ...founder, image_url: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="https://..." />
                    </div>
                    {founder.image_url && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
                        <img src={founder.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio Paragraph 1</label>
                      <textarea value={founder.bio} onChange={e => setFounder({ ...founder, bio: e.target.value })} rows={5} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio Paragraph 2</label>
                      <textarea value={founder.bio_paragraph_2 || ''} onChange={e => setFounder({ ...founder, bio_paragraph_2: e.target.value })} rows={5} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Skills (comma separated)</label>
                      <input value={(founder.skills || []).join(', ')} onChange={e => setFounder({ ...founder, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab !== 'founder' && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${currentSection?.color}15` }}>
                      <span className="text-sm font-black" style={{ color: currentSection?.color }}>{currentSection?.label.charAt(0)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">{currentSection?.label} Team</h2>
                  </div>
                  <button onClick={() => { setShowAddForm(true); setEditingTeamMember(null); }} className="px-4 py-2 rounded-xl bg-white/5 text-white border border-[rgba(255,255,255,0.08)] text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">
                    + Add Member
                  </button>
                </div>

                {showAddForm && (
                  <div className="mb-6 p-5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F172A]">
                    <h3 className="text-sm font-bold text-white mb-4">New Team Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="Name" className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                      <input value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} placeholder="Role" className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                      <input value={newMember.image_url || ''} onChange={e => setNewMember({ ...newMember, image_url: e.target.value })} placeholder="Image URL" className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                      <input value={newMember.sort_order || 0} onChange={e => setNewMember({ ...newMember, sort_order: parseInt(e.target.value) || 0 })} placeholder="Sort Order" type="number" className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                    </div>
                    <textarea value={newMember.bio || ''} onChange={e => setNewMember({ ...newMember, bio: e.target.value })} placeholder="Bio" rows={3} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none mb-4" />
                    <div className="flex gap-2">
                      <button onClick={addTeamMember} disabled={saving} className="px-4 py-2 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-sm font-medium hover:bg-[#10B981]/20 transition-colors cursor-pointer disabled:opacity-50">{saving ? 'Adding...' : 'Add Member'}</button>
                      <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 border border-[rgba(255,255,255,0.08)] text-sm font-medium hover:text-white transition-colors cursor-pointer">Cancel</button>
                    </div>
                  </div>
                )}

                {editingTeamMember && (
                  <div className="mb-6 p-5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F172A]">
                    <h3 className="text-sm font-bold text-white mb-4">Edit {editingTeamMember.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input value={editingTeamMember.name} onChange={e => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                      <input value={editingTeamMember.role} onChange={e => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                      <input value={editingTeamMember.image_url || ''} onChange={e => setEditingTeamMember({ ...editingTeamMember, image_url: e.target.value })} placeholder="Image URL" className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                      <input value={editingTeamMember.sort_order} onChange={e => setEditingTeamMember({ ...editingTeamMember, sort_order: parseInt(e.target.value) || 0 })} type="number" className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                    </div>
                    <textarea value={editingTeamMember.bio} onChange={e => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none mb-4" />
                    <div className="flex gap-2">
                      <button onClick={() => saveTeamMember(editingTeamMember)} disabled={saving} className="px-4 py-2 rounded-xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 text-sm font-medium hover:bg-[#06B6D4]/20 transition-colors cursor-pointer disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => deleteTeamMember(editingTeamMember.id)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors cursor-pointer">Delete</button>
                      <button onClick={() => setEditingTeamMember(null)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 border border-[rgba(255,255,255,0.08)] text-sm font-medium hover:text-white transition-colors cursor-pointer">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentTeam.map(member => (
                    <div key={member.id} onClick={() => setEditingTeamMember(member)} className="group p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0F172A] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[rgba(255,255,255,0.08)]">
                          <img src={member.image_url || ''} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.role}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{member.bio}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(member.skills || []).slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${
                toast.type === 'success' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}