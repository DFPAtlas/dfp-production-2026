'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import { motion } from '@/components/motion';
import { X, User, Mail, Building2, Phone, FileText, Loader2, Globe, MapPin, Hash } from 'lucide-react';

interface ClientFormProps {
  client: any | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function ClientForm({ client, onClose, onSave }: ClientFormProps) {
  const [formData, setFormData] = useState({
    contact_name: '', email: '', company_name: '', trading_name: '', phone: '',
    website: '', industry: '', address: '', notes: '', status: 'Active',
    client_type: 'business', preferred_contact_method: 'email', data_classification: 'internal',
    timezone: 'Europe/London', billing_currency: 'GBP', user_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        contact_name: client.contact_name || '', email: client.email || '',
        company_name: client.company_name || '', trading_name: client.trading_name || '',
        phone: client.phone || '', website: client.website || '', industry: client.industry || '',
        address: client.address || '', notes: client.notes || '', status: client.status || 'Active',
        client_type: client.client_type || 'business',
        preferred_contact_method: client.preferred_contact_method || 'email',
        data_classification: client.data_classification || 'internal',
        timezone: client.timezone || 'Europe/London', billing_currency: client.billing_currency || 'GBP',
        user_id: client.user_id || '',
      });
    }
  }, [client]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try { await onSave(formData); onClose(); } catch {}
    finally { setSaving(false); }
  };

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all ${errors[field] ? 'border-red-400/30 bg-red-500/5' : 'border-[rgba(255,255,255,0.08)]'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{client ? 'Edit Client' : 'Add New Client'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className={inputClass('company_name')} placeholder="Acme Ltd" />
              </div>
              {errors.company_name && <p className="text-red-400 text-xs mt-1">{errors.company_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trading Name</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={formData.trading_name} onChange={(e) => setFormData({ ...formData, trading_name: e.target.value })}
                  className={inputClass('trading_name')} placeholder="Acme Trading" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass('email')} placeholder="contact@company.com" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass('phone')} placeholder="+44 20 7946 0000" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className={inputClass('contact_name')} placeholder="John Smith" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className={inputClass('website')} placeholder="https://company.com" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Industry</label>
              <input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className={inputClass('industry')} placeholder="Technology" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {['Prospect', 'Onboarding', 'Active', 'Paused'].map(s => (
                  <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                      formData.status === s
                        ? s === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : s === 'Onboarding' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : s === 'Paused' ? 'bg-slate-500/10 text-slate-400 border border-white/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-white/5 text-slate-500 border border-[rgba(255,255,255,0.08)] hover:bg-white/8'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 300) })}
                rows={2} maxLength={300}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" placeholder="123 Main Street, London" />
            </div>
          </div>

          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center gap-1"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)]">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client Type</label>
                  <select value={formData.client_type} onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                    <option value="business">Business</option>
                    <option value="individual">Individual</option>
                    <option value="government">Government</option>
                    <option value="nonprofit">Nonprofit</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Method</label>
                  <select value={formData.preferred_contact_method} onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="meeting">Meeting</option>
                    <option value="portal">Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Classification</label>
                  <select value={formData.data_classification} onChange={(e) => setFormData({ ...formData, data_classification: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                    <option value="internal">Internal</option>
                    <option value="confidential">Confidential</option>
                    <option value="restricted">Restricted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portal User ID (Supabase Auth UUID)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value.trim() })}
                    className={inputClass('user_id')}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Link this client to a Supabase Auth user for portal access</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 500) })}
                rows={4} maxLength={500}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" placeholder="Internal notes about this client..." />
            </div>
            <p className="text-xs text-slate-500 mt-1">{formData.notes.length}/500 characters</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
