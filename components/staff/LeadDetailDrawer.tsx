'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import {
  X, Mail, Phone, Globe, MapPin, Building2, Calendar,
  User, Loader2, Check, AlertTriangle, ArrowUpRight,
  UserPlus, DollarSign, Tag, Hash,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  service_interest: string | null;
  message: string | null;
  budget_range: string | null;
  location: string | null;
  status: string;
  stage: string;
  priority: string;
  estimated_value: number | null;
  contact_role: string | null;
  contact_phone: string | null;
  industry: string | null;
  source: string;
  campaign: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  converted_to_client: string | null;
  converted_at: string | null;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

interface LeadDetailDrawerProps {
  lead: Lead;
  staff: StaffInfo[];
  currentUserId: string;
  currentUserRole: string;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onAssign: (id: string, staffId: string) => void;
  onConvert: (lead: Lead) => void;
  onCloseLead: (lead: Lead) => void;
}

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'closed'] as const;

export default function LeadDetailDrawer({
  lead, staff, currentUserId, currentUserRole,
  onClose, onStatusChange, onAssign, onConvert, onCloseLead,
}: LeadDetailDrawerProps) {
  const [localLead, setLocalLead] = useState(lead);
  const [assigning, setAssigning] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const canChangeStatus = currentUserRole === 'admin' || currentUserRole === 'super_admin' || currentUserRole === 'project_lead';
  const canAssign = currentUserRole === 'admin' || currentUserRole === 'super_admin' || currentUserRole === 'project_lead';
  const canConvert = (currentUserRole === 'admin' || currentUserRole === 'super_admin' || currentUserRole === 'project_lead') && localLead.status !== 'converted';

  useEffect(() => {
    setLocalLead(lead);
  }, [lead]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    if (drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const handleAssign = async (staffId: string) => {
    setAssigning(true);
    const prev = localLead.assigned_to;
    setLocalLead(l => ({ ...l, assigned_to: staffId || null }));
    try {
      await onAssign(localLead.id, staffId);
    } catch {
      setLocalLead(l => ({ ...l, assigned_to: prev }));
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setStatusChanging(true);
    const prev = localLead.status;
    setLocalLead(l => ({ ...l, status }));
    try {
      await onStatusChange(localLead.id, status);
    } catch {
      setLocalLead(l => ({ ...l, status: prev }));
    } finally {
      setStatusChanging(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new': return { color: '#06B6D4', bg: 'bg-[#06B6D4]/10' };
      case 'contacted': return { color: '#F59E0B', bg: 'bg-[#F59E0B]/10' };
      case 'qualified': return { color: '#10B981', bg: 'bg-[#10B981]/10' };
      case 'converted': return { color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' };
      case 'closed': return { color: '#9CA3AF', bg: 'bg-white/5' };
      default: return { color: '#94A3B8', bg: 'bg-white/5' };
    }
  };

  const statusStyle = getStatusStyle(localLead.status);

  const infoItems = [
    { label: 'Company', value: localLead.company_name, icon: Building2 },
    { label: 'Phone', value: localLead.phone || localLead.contact_phone, icon: Phone },
    { label: 'Website', value: localLead.website, icon: Globe },
    { label: 'Location', value: localLead.location, icon: MapPin },
    { label: 'Service Interest', value: localLead.service_interest, icon: ArrowUpRight },
    { label: 'Budget Range', value: localLead.budget_range, icon: DollarSign },
    { label: 'Industry', value: localLead.industry, icon: Tag },
    { label: 'Contact Role', value: localLead.contact_role, icon: User },
  ];

  const metaItems = [
    { label: 'Source', value: localLead.source, icon: Hash },
    { label: 'Campaign', value: localLead.campaign, icon: Tag },
    { label: 'Priority', value: localLead.priority, icon: AlertTriangle },
    { label: 'Est. Value', value: localLead.estimated_value ? `£${localLead.estimated_value.toLocaleString()}` : null, icon: DollarSign },
    { label: 'Received', value: formatDateTime(localLead.created_at), icon: Calendar },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Lead details: ${localLead.name}`}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-[#1E293B] border-l border-[rgba(255,255,255,0.08)] shadow-2xl overflow-y-auto"
          onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#1E293B] border-b border-[rgba(255,255,255,0.06)] px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-white">Lead Details</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4]/10 to-[#06B6D4]/10 flex items-center justify-center text-xl font-bold text-[#06B6D4] shrink-0">
                {localLead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-white truncate">{localLead.name}</p>
                <p className="text-sm text-slate-400 truncate">{localLead.email}</p>
              </div>
              <span
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border shrink-0"
                style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '15', color: statusStyle.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.color }} />
                {localLead.status}
              </span>
            </div>

            <div className="flex gap-2">
              <a
                href={`mailto:${localLead.email}`}
                className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:border-[rgba(255,255,255,0.18)] transition-all cursor-pointer whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
              <button
                onClick={() => copyToClipboard(localLead.email, 'email')}
                className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:border-[rgba(255,255,255,0.18)] transition-all cursor-pointer whitespace-nowrap"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span className="text-[#10B981]">Copied</span>
                  </>
                ) : (
                  'Copy Email'
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {infoItems.map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="text-sm font-medium text-slate-300 truncate">{item.value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>

            {localLead.website && (() => {
              let safeUrl = localLead.website.trim();
              if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;
              try {
                new URL(safeUrl);
                return (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:border-[rgba(255,255,255,0.18)] transition-all cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                );
              } catch {
                return null;
              }
            })()}

            {localLead.message && (
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Message</p>
                <div className="p-4 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {localLead.message}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {metaItems.filter(m => m.value).map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="text-sm font-medium text-slate-300 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Assigned To</p>
              {canAssign ? (
                <div className="relative">
                  <select
                    value={localLead.assigned_to || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={assigning}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 cursor-pointer appearance-none pr-8 disabled:opacity-50"
                  >
                    <option value="" className="bg-[#1E293B]">Unassigned</option>
                    {staff.filter(s => s.id !== currentUserId || true).map(s => (
                      <option key={s.id} value={s.id} className="bg-[#1E293B]">{s.full_name || 'Unknown'} ({s.role})</option>
                    ))}
                  </select>
                  {assigning && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  {localLead.assigned_to ? (staff.find(s => s.id === localLead.assigned_to)?.full_name || 'Unknown') : 'Unassigned'}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Update Status</p>
              {canChangeStatus ? (
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter(s => s !== 'converted').map(s => {
                    const st = getStatusStyle(s);
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={statusChanging || localLead.status === s}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        style={{
                          borderColor: localLead.status === s ? st.color + '40' : 'rgba(255,255,255,0.1)',
                          backgroundColor: localLead.status === s ? st.color + '15' : 'transparent',
                          color: localLead.status === s ? st.color : '#94A3B8',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border"
                  style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '10', color: statusStyle.color }}
                >
                  {localLead.status}
                </span>
              )}
            </div>

            {localLead.status === 'converted' && localLead.converted_to_client && (
              <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <p className="text-sm font-semibold text-[#10B981]">Converted to Client</p>
                </div>
                <p className="text-xs text-slate-400">
                  {formatDate(localLead.converted_at)}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
              {canConvert && (
                <button
                  onClick={() => onConvert(localLead)}
                  className="flex-1 py-3 bg-[#06B6D4] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  Convert to Client
                </button>
              )}
              {localLead.status !== 'closed' && (
                <button
                  onClick={() => onCloseLead(localLead)}
                  className="px-4 py-3 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-semibold text-slate-400 hover:text-[#EF4444] hover:border-[#EF4444]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  Close Lead
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-3 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all cursor-pointer ml-auto whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
