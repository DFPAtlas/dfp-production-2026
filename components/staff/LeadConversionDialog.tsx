'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import {
  X, Loader2, AlertTriangle, UserPlus, Building2, Search, Check,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  service_interest: string | null;
  industry: string | null;
}

interface ClientInfo {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
}

interface LeadConversionDialogProps {
  lead: Lead;
  onClose: () => void;
  onConverted: (clientId: string) => void;
}

export default function LeadConversionDialog({ lead, onClose, onConverted }: LeadConversionDialogProps) {
  const [mode, setMode] = useState<'review' | 'converting' | 'success' | 'error'>('review');
  const [clientMode, setClientMode] = useState<'new' | 'existing'>('new');
  const [existingClientId, setExistingClientId] = useState('');
  const [existingSearch, setExistingSearch] = useState('');
  const [existingClients, setExistingClients] = useState<ClientInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [newClient, setNewClient] = useState({
    company_name: lead.company_name || lead.name || '',
    contact_name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    website: lead.website || '',
    industry: lead.industry || lead.service_interest || '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [convertedClientId, setConvertedClientId] = useState<string | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode === 'review') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [onClose, mode]);

  useEffect(() => {
    if (clientMode !== 'existing' || !existingSearch || existingSearch.length < 2) {
      setExistingClients([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const q = existingSearch.toLowerCase();
      const { data } = await supabase
        .from('clients')
        .select('id, company_name, contact_name, email')
        .or(`company_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);
      setExistingClients(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [existingSearch, clientMode]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (clientMode === 'existing' && !existingClientId) {
      errors.client = 'Please select an existing client.';
    }
    if (clientMode === 'new') {
      if (!newClient.company_name.trim()) errors.company_name = 'Company name is required.';
      if (!newClient.contact_name.trim()) errors.contact_name = 'Contact name is required.';
      if (!newClient.email.trim()) errors.email = 'Email is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConvert = async () => {
    if (!validate()) return;

    setMode('converting');
    setError('');

    const payload: Record<string, unknown> = {
      lead_id: lead.id,
      client_mode: clientMode,
    };

    if (clientMode === 'existing') {
      payload.existing_client_id = existingClientId;
    } else {
      payload.new_client = {
        company_name: newClient.company_name.trim(),
        contact_name: newClient.contact_name.trim(),
        email: newClient.email.trim(),
        phone: newClient.phone.trim(),
        website: newClient.website.trim(),
        industry: newClient.industry.trim() || null,
      };
    }

    const { data: result, error: rpcError } = await supabase.rpc('convert_lead_to_client', { payload });

    if (rpcError) {
      setError(rpcError.message);
      setMode('error');
      return;
    }

    if (!result?.success) {
      setError(result?.error || 'Conversion failed. Please try again.');
      setMode('error');
      return;
    }

    setConvertedClientId(result.client_id);
    onConverted(result.client_id);
    setMode('success');
  };

  const selectedExisting = existingClients.find(c => c.id === existingClientId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={() => mode === 'review' && onClose()}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Convert lead to client"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
        >
          {mode === 'review' && (
            <>
              <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#06B6D4]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Convert to Client</h3>
                    <p className="text-xs text-slate-400">Create or link a client record for this lead</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-[#06B6D4]/5 border border-[#06B6D4]/10 rounded-xl">
                  <p className="text-sm font-medium text-white mb-1">{lead.name}</p>
                  <p className="text-xs text-slate-400">{lead.email}</p>
                  {lead.company_name && <p className="text-xs text-slate-400 mt-0.5">{lead.company_name}</p>}
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 mb-3">Client Source</p>
                  <div className="flex bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => { setClientMode('new'); setFormErrors({}); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${clientMode === 'new' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Create New Client
                    </button>
                    <button
                      onClick={() => { setClientMode('existing'); setFormErrors({}); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${clientMode === 'existing' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Link Existing Client
                    </button>
                  </div>
                </div>

                {clientMode === 'new' ? (
                  <div className="space-y-4">
                    <Field label="Company Name" required error={formErrors.company_name}>
                      <input
                        type="text"
                        value={newClient.company_name}
                        onChange={(e) => setNewClient(p => ({ ...p, company_name: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                        placeholder="e.g. Acme Corp"
                      />
                    </Field>
                    <Field label="Contact Name" required error={formErrors.contact_name}>
                      <input
                        type="text"
                        value={newClient.contact_name}
                        onChange={(e) => setNewClient(p => ({ ...p, contact_name: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                        placeholder="e.g. John Smith"
                      />
                    </Field>
                    <Field label="Email" required error={formErrors.email}>
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                        placeholder="john@acmecorp.com"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Phone" error="">
                        <input
                          type="text"
                          value={newClient.phone}
                          onChange={(e) => setNewClient(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                          placeholder="+44 20..."
                        />
                      </Field>
                      <Field label="Website" error="">
                        <input
                          type="text"
                          value={newClient.website}
                          onChange={(e) => setNewClient(p => ({ ...p, website: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                          placeholder="acmecorp.com"
                        />
                      </Field>
                    </div>
                    <Field label="Industry" error="">
                      <input
                        type="text"
                        value={newClient.industry}
                        onChange={(e) => setNewClient(p => ({ ...p, industry: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                        placeholder="e.g. Technology, Healthcare..."
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by company name or email..."
                        value={existingSearch}
                        onChange={(e) => setExistingSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                      />
                      {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    {formErrors.client && (
                      <p className="text-xs text-[#EF4444]">{formErrors.client}</p>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {existingClients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setExistingClientId(c.id); setFormErrors({}); }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${existingClientId === c.id ? 'border-[#06B6D4]/40 bg-[#06B6D4]/5' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-[#06B6D4]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{c.company_name || 'Unnamed'}</p>
                              <p className="text-xs text-slate-400 truncate">{c.contact_name} · {c.email}</p>
                            </div>
                            {existingClientId === c.id && (
                              <Check className="w-4 h-4 text-[#06B6D4] shrink-0 ml-auto" />
                            )}
                          </div>
                        </button>
                      ))}

                      {!searching && existingSearch.length >= 2 && existingClients.length === 0 && (
                        <p className="text-center text-xs text-slate-500 py-4">No matching clients found</p>
                      )}

                      {existingSearch.length < 2 && (
                        <p className="text-center text-xs text-slate-500 py-4">Type to search existing clients</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">What will happen</p>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-[#06B6D4] mt-0.5">1.</span>
                      {clientMode === 'new' ? 'A new client record will be created' : 'The lead will be linked to the selected client'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#06B6D4] mt-0.5">2.</span>
                      The lead will be marked as converted
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#06B6D4] mt-0.5">3.</span>
                      You can then start project discovery for this client
                    </li>
                  </ul>
                  <p className="text-[10px] text-slate-500 mt-2">
                    No project, budget, or access records will be created during conversion.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConvert}
                    className="flex-1 py-3 bg-[#06B6D4] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    Convert to Client
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'converting' && (
            <div className="p-10 text-center">
              <Loader2 className="w-10 h-10 text-[#06B6D4] animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold mb-1">Converting lead to client...</p>
              <p className="text-sm text-slate-400">This should only take a moment</p>
            </div>
          )}

          {mode === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Client Created</h3>
              <p className="text-sm text-slate-400 mb-6">
                {lead.name} has been converted to a client. No placeholder project was created.
              </p>
              <div className="space-y-3">
                {convertedClientId && (
                  <Link
                    href={`/staff/projects/new?client=${convertedClientId}&lead=${lead.id}${lead.service_interest ? `&service=${encodeURIComponent(lead.service_interest)}` : ''}`}
                    className="block w-full py-3 bg-[#06B6D4] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer text-center whitespace-nowrap"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start Project Discovery
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                )}
                <button
                  onClick={onClose}
                  className="block w-full py-3 border border-[rgba(255,255,255,0.1)] rounded-xl font-semibold text-slate-300 text-sm hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                >
                  Back to Leads
                </button>
              </div>
            </div>
          )}

          {mode === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Conversion Failed</h3>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setMode('review')}
                  className="px-6 py-3 bg-[#06B6D4] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-[rgba(255,255,255,0.1)] rounded-xl font-semibold text-slate-300 text-sm hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
    </div>
  );
}
