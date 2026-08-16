'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Filter, Eye, MessageSquare, Code, CreditCard, Send, Clock, Globe, Smartphone, Bot, Share2, ShoppingCart, Server, ChevronDown, ChevronUp, X, Check, AlertCircle, FileText, Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';
import AdminShell from '../../../components/admin/AdminShell';



interface Submission {
  id: string;
  name: string;
  email: string;
  project_type: string;
  budget_range: string;
  initial_message: string;
  website_type: string;
  mobile_app: boolean;
  ai_agents: boolean;
  social_media: boolean;
  reference_urls: string[];
  visual_effects: string;
  database_type: string;
  ecommerce: boolean;
  stripe_payment: boolean;
  timeline: string;
  managed_hosting: boolean;
  experience_level: string;
  additional_notes: string;
  status: string;
  admin_notes: string;
  code_examples: string;
  payment_plan: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  reviewing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  converted: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
};

const timelineLabels: Record<string, string> = {
  urgent: '2-4 Weeks (Rush)',
  standard: '1-2 Months',
  relaxed: '2-3 Months',
  flexible: 'No Rush'
};

const visualEffectLabels: Record<string, string> = {
  minimal: 'Minimal & Clean',
  modern: 'Modern Animations',
  immersive: 'Immersive Experience',
  parallax: 'Parallax Scrolling'
};

const databaseLabels: Record<string, string> = {
  none: 'No Database',
  simple: 'Simple Storage',
  relational: 'Relational Database',
  realtime: 'Real-time Database'
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase.from('project_submissions').select('*').order('created_at', { ascending: false });
    if (!error && data) setSubmissions(data);
    setLoading(false);
  };

  const updateSubmission = async (id: string, updates: Partial<Submission>) => {
    const { error } = await supabase.from('project_submissions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const convertToProject = async (submission: Submission) => {
    setConvertingId(submission.id);
    try {
      const { data: client, error: clientError } = await supabase.from('profiles').insert({ email: submission.email, full_name: submission.name, company_name: submission.name + ' Company', role: 'client' }).select().single();
      if (clientError && !clientError.message.includes('duplicate')) throw clientError;
      const clientId = client?.id;
      const { error: projectError } = await supabase.from('projects').insert({ name: `${submission.name} - ${submission.website_type || submission.project_type}`, client_id: clientId, status: 'planning', budget: parseInt(submission.budget_range.replace(/[^0-9]/g, '')) || 5000, description: submission.initial_message, start_date: new Date().toISOString() });
      if (projectError) throw projectError;
      await updateSubmission(submission.id, { status: 'converted' });
      setShowConvertModal(false);
    } catch (error) { console.error('Conversion error:', error); }
    finally { setConvertingId(null); }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    reviewing: submissions.filter(s => s.status === 'reviewing').length,
    converted: submissions.filter(s => s.status === 'converted').length
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#0066FF]/30 border-t-[#0066FF] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Submissions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review and manage incoming project briefs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Submissions', value: stats.total, color: '#1E293B', bg: 'bg-white' },
            { label: 'Pending Review', value: stats.pending, color: '#F59E0B', bg: 'bg-amber-50 border-amber-100' },
            { label: 'In Review', value: stats.reviewing, color: '#0066FF', bg: 'bg-blue-50 border-blue-100' },
            { label: 'Converted', value: stats.converted, color: '#8B5CF6', bg: 'bg-purple-50 border-purple-100' }
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-4 border ${stat.bg}`}
            >
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="converted">Converted</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No submissions found</p>
              <p className="text-sm text-slate-500 mt-1">{searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Submissions will appear here when visitors submit the project wizard'}</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden hover:border-[rgba(255,255,255,0.15)] transition-all"
              >
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4]/10 to-[#22D3EE]/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#06B6D4]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{submission.name}</p>
                      <p className="text-xs text-slate-400">{submission.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[submission.status]}`}>
                      {submission.status}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">{submission.budget_range}</span>
                    <span className="text-xs text-slate-500">{new Date(submission.created_at).toLocaleDateString('en-GB')}</span>
                    {expandedId === submission.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === submission.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[rgba(255,255,255,0.06)]"
                    >
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                          <h3 className="font-bold text-sm text-[#06B6D4] uppercase tracking-wider">Project Details</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {[
                              { label: 'Website Type', value: submission.website_type || 'Not specified' },
                              { label: 'Timeline', value: timelineLabels[submission.timeline] || 'Not specified' },
                              { label: 'Visual Style', value: visualEffectLabels[submission.visual_effects] || 'Not specified' },
                              { label: 'Database', value: databaseLabels[submission.database_type] || 'Not specified' },
                              { label: 'Experience Level', value: submission.experience_level },
                              { label: 'Budget', value: submission.budget_range }
                            ].map(item => (
                              <div key={item.label}>
                                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                                <p className="font-medium text-white capitalize">{item.value}</p>
                              </div>
                            ))}
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 mb-2">Services Required</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { flag: submission.mobile_app, label: 'Mobile App', icon: 'ri-smartphone-line', color: '#3B82F6' },
                                { flag: submission.ai_agents, label: 'AI Agents', icon: 'ri-robot-line', color: '#8B5CF6' },
                                { flag: submission.social_media, label: 'Social Media', icon: 'ri-share-line', color: '#EC4899' },
                                { flag: submission.ecommerce, label: 'E-commerce', icon: 'ri-shopping-cart-line', color: '#10B981' },
                                { flag: submission.stripe_payment, label: 'Stripe', icon: 'ri-bank-card-line', color: '#6366F1' },
                                { flag: submission.managed_hosting, label: 'Managed Hosting', icon: 'ri-server-line', color: '#F59E0B' }
                              ].filter(s => s.flag).map(s => (
                                <span key={s.label} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border" style={{ backgroundColor: `${s.color}10`, color: s.color, borderColor: `${s.color}20` }}>
                                  <i className={s.icon} /> {s.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          {submission.reference_urls?.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-400 mb-2">Reference URLs</p>
                              <div className="space-y-1">
                                {submission.reference_urls.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#06B6D4] hover:underline">
                                    <Globe className="w-3.5 h-3.5" />{url}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {submission.initial_message && (
                            <div>
                              <p className="text-xs text-slate-400 mb-2">Initial Message</p>
                              <p className="text-sm text-slate-400 bg-white/5 p-3 rounded-xl">{submission.initial_message}</p>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Admin */}
                        <div className="space-y-5">
                          <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Admin Actions</h3>

                          <div>
                            <p className="text-xs text-slate-400 mb-2">Status</p>
                            <select
                              value={submission.status}
                              onChange={(e) => updateSubmission(submission.id, { status: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="converted">Converted</option>
                            </select>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Internal Notes</p>
                            <textarea
                              value={submission.admin_notes || ''}
                              onChange={(e) => updateSubmission(submission.id, { admin_notes: e.target.value })}
                              placeholder="Add notes about this submission..."
                              rows={3}
                              maxLength={500}
                              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                            />
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-2"><Code className="w-4 h-4" /> Code Examples / Tech Stack</p>
                            <textarea
                              value={submission.code_examples || ''}
                              onChange={(e) => updateSubmission(submission.id, { code_examples: e.target.value })}
                              placeholder="Add code snippets, tech recommendations..."
                              rows={3}
                              maxLength={500}
                              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                            />
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment Plan</p>
                            <textarea
                              value={submission.payment_plan || ''}
                              onChange={(e) => updateSubmission(submission.id, { payment_plan: e.target.value })}
                              placeholder="e.g., 50% upfront, 25% at milestone 1, 25% on completion..."
                              rows={2}
                              maxLength={500}
                              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                            />
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => { setEditingSubmission(submission); setShowConvertModal(true); }}
                              disabled={submission.status === 'converted'}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] rounded-xl font-bold text-white hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserPlus className="w-4 h-4" />
                              Convert to Project
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* Convert Modal */}
        <AnimatePresence>
          {showConvertModal && editingSubmission && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowConvertModal(false)}
            >
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6 text-white"
                onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Convert to Project</h3>
                  <button onClick={() => setShowConvertModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Client', value: editingSubmission.name, sub: editingSubmission.email },
                    { label: 'Project Type', value: editingSubmission.website_type || editingSubmission.project_type },
                    { label: 'Budget', value: editingSubmission.budget_range }
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-white/5 rounded-xl">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                      {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300">This will:</p>
                      <ul className="text-sm text-amber-300 mt-1 space-y-0.5">
                        <li>• Create a new client profile</li>
                        <li>• Create a new project in the admin panel</li>
                        <li>• Mark this submission as converted</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowConvertModal(false)} className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={() => convertToProject(editingSubmission)}
                    disabled={convertingId === editingSubmission.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {convertingId === editingSubmission.id ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Converting...</> : <><Check className="w-4 h-4" />Confirm</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}
