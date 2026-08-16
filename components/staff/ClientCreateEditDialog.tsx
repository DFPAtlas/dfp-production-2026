'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import {
  X, Loader2, AlertTriangle, Building2, Check,
} from 'lucide-react';

interface ClientData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  industry: string;
  status: string;
  project_lead: string;
  notes: string;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

interface ClientCreateEditDialogProps {
  mode: 'create' | 'edit';
  initialData?: ClientData & { id?: string };
  staff: StaffInfo[];
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

function createEmptyClient(): ClientData {
  return {
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    industry: '',
    status: 'active',
    project_lead: '',
    notes: '',
  };
}

export default function ClientCreateEditDialog({
  mode, initialData, staff, onClose, onSuccess,
}: ClientCreateEditDialogProps) {
  const [data, setData] = useState<ClientData>(initialData || createEmptyClient());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<{ id: string; company_name: string | null; email: string | null }[]>([]);
  const [dupChecked, setDupChecked] = useState(false);
  const [dupConfirm, setDupConfirm] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [onClose, saving]);

  const checkDuplicates = async () => {
    if (!data.company_name.trim() && !data.email.trim()) return;
    const conditions: string[] = [];
    if (data.company_name.trim()) conditions.push(`company_name.ilike.%${data.company_name.trim().toLowerCase()}%`);
    if (data.email.trim()) conditions.push(`email.ilike.%${data.email.trim().toLowerCase()}%`);

    const query = conditions.join(',');
    const { data: existing } = await supabase
      .from('clients')
      .select('id, company_name, email')
      .or(query)
      .limit(10);

    if (existing && existing.length > 0) {
      setDuplicates(existing.filter(d => mode === 'edit' ? d.id !== initialData?.id : true));
    }
    setDupChecked(true);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!data.company_name.trim()) errors.company_name = 'Company name is required.';
    if (!data.contact_name.trim()) errors.contact_name = 'Contact name is required.';
    if (!data.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Please enter a valid email.';
    if (data.website.trim() && !/^https?:\/\//i.test(data.website.trim())) {
      try {
        new URL('https://' + data.website.trim());
      } catch {
        errors.website = 'Please enter a valid website address.';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!dupConfirm && duplicates.length > 0 && !dupChecked) {
      await checkDuplicates();
      return;
    }
    if (duplicates.length > 0 && !dupConfirm) return;

    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      company_name: data.company_name.trim(),
      contact_name: data.contact_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim() || null,
      website: data.website.trim() || null,
      address: data.address.trim() || null,
      industry: data.industry.trim() || null,
      status: data.status,
      project_lead: data.project_lead || null,
      notes: data.notes.trim() || null,
    };

    const clientId = initialData?.id;
    if (mode === 'edit' && !clientId) {
      setError('A client ID is required to save changes.');
      setSaving(false);
      return;
    }

    const { data: result, error: saveError } = mode === 'create'
      ? await supabase.from('clients').insert(payload).select('id').single()
      : await supabase.from('clients').update(payload).eq('id', clientId as string).select('id').single();

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSuccess(result.id);
  };

  const updateField = (field: keyof ClientData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    if (dupChecked && (field === 'company_name' || field === 'email')) {
      setDuplicates([]);
      setDupConfirm(false);
      setDupChecked(false);
    }
  };

  const title = mode === 'create' ? 'Add Client' : 'Edit Client';
  const saveLabel = mode === 'create' ? 'Create Client' : 'Save Changes';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center p-4 pt-12 overflow-y-auto"
        onClick={() => !saving && onClose()}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-lg w-full"
          onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <div>
                <h3 className="font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400">{mode === 'create' ? 'Add a new client to the workspace' : 'Update client information'}</p>
              </div>
            </div>
            <button onClick={onClose} disabled={saving} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {duplicates.length > 0 && !dupConfirm && (
              <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl space-y-2">
                <p className="text-sm font-semibold text-[#F59E0B] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Possible Duplicates Found
                </p>
                <p className="text-xs text-slate-400">The following existing clients may match your entry:</p>
                <div className="space-y-1">
                  {duplicates.map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-xs text-slate-300">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      {d.company_name} {d.email && <span className="text-slate-500">({d.email})</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setDupConfirm(true)}
                    className="px-3 py-1.5 bg-[#F59E0B] text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Create Anyway
                  </button>
                  <button
                    onClick={() => { setDuplicates([]); setDupConfirm(false); }}
                    className="px-3 py-1.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-xs text-slate-400 cursor-pointer whitespace-nowrap"
                  >
                    Review Fields
                  </button>
                </div>
              </div>
            )}

            <Field label="Company Name" required error={formErrors.company_name}>
              <input
                type="text"
                value={data.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                placeholder="e.g. Acme Corp"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name" required error={formErrors.contact_name}>
                <input
                  type="text"
                  value={data.contact_name}
                  onChange={(e) => updateField('contact_name', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                  placeholder="e.g. John Smith"
                />
              </Field>
              <Field label="Email" required error={formErrors.email}>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                  placeholder="john@acmecorp.com"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" error="">
                <input
                  type="text"
                  value={data.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                  placeholder="+44 20..."
                />
              </Field>
              <Field label="Website" error={formErrors.website}>
                <input
                  type="text"
                  value={data.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                  placeholder="acmecorp.com"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry" error="">
                <input
                  type="text"
                  value={data.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                  placeholder="e.g. Technology"
                />
              </Field>
              <Field label="Status" error="">
                <div className="relative">
                  <select
                    value={data.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 cursor-pointer appearance-none pr-8"
                  >
                    <option value="active" className="bg-[#1E293B]">Active</option>
                    <option value="prospect" className="bg-[#1E293B]">Prospect</option>
                    <option value="on_hold" className="bg-[#1E293B]">On Hold</option>
                    <option value="inactive" className="bg-[#1E293B]">Inactive</option>
                  </select>
                </div>
              </Field>
            </div>

            <Field label="Address" error="">
              <input
                type="text"
                value={data.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all"
                placeholder="e.g. 123 Main St, London"
              />
            </Field>

            <Field label="Relationship Lead" error="">
              <div className="relative">
                <select
                  value={data.project_lead}
                  onChange={(e) => updateField('project_lead', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 cursor-pointer appearance-none pr-8"
                >
                  <option value="" className="bg-[#1E293B]">Unassigned</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#1E293B]">{s.full_name || 'Unknown'} ({s.role})</option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Notes" error="">
              <textarea
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/30 transition-all resize-none"
                placeholder="Internal notes..."
              />
            </Field>
          </div>

          <div className="p-6 border-t border-[rgba(255,255,255,0.06)] flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-[#06B6D4] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saveLabel}
            </button>
          </div>
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
