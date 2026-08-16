'use client';

import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import {
  X, Mail, Phone, Globe, MapPin, Building2, Calendar,
  Loader2, Check, User, ExternalLink, FolderKanban, Edit2,
  ArrowRight, Copy,
} from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  industry: string | null;
  status: string;
  project_lead: string | null;
  lead_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_count: number;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

interface ClientDetailDrawerProps {
  client: Client;
  staff: StaffInfo[];
  currentUserId: string;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onStatusChange: (id: string, status: string) => void;
  onAssignLead: (id: string, staffId: string) => void;
}

const CLIENT_STATUSES = ['active', 'inactive', 'prospect', 'on_hold'] as const;

export default function ClientDetailDrawer({
  client, staff, currentUserId, canEdit,
  onClose, onEdit, onStatusChange, onAssignLead,
}: ClientDetailDrawerProps) {
  const [localClient, setLocalClient] = useState(client);
  const [assigning, setAssigning] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setLocalClient(client);
  }, [client]);

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
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
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

  const handleAssignLead = async (staffId: string) => {
    setAssigning(true);
    const prev = localClient.project_lead;
    setLocalClient(l => ({ ...l, project_lead: staffId || null }));
    try { await onAssignLead(localClient.id, staffId); } catch {
      setLocalClient(l => ({ ...l, project_lead: prev }));
    } finally { setAssigning(false); }
  };

  const handleStatusChange = async (status: string) => {
    setStatusChanging(true);
    const prev = localClient.status;
    setLocalClient(l => ({ ...l, status }));
    try { await onStatusChange(localClient.id, status); } catch {
      setLocalClient(l => ({ ...l, status: prev }));
    } finally { setStatusChanging(false); }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); }
    catch { /* unavailable */ }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { color: '#10B981', bg: 'bg-[#10B981]/10' };
      case 'prospect': return { color: '#F59E0B', bg: 'bg-[#F59E0B]/10' };
      case 'on_hold': return { color: '#F97316', bg: 'bg-[#F97316]/10' };
      case 'inactive': return { color: '#9CA3AF', bg: 'bg-white/5' };
      default: return { color: '#10B981', bg: 'bg-[#10B981]/10' };
    }
  };

  const statusStyle = getStatusStyle(localClient.status);
  const leadStaff = staff.find(s => s.id === localClient.project_lead);

  const normalizeUrl = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    let safe = trimmed;
    if (!/^https?:\/\//i.test(safe)) safe = 'https://' + safe;
    try { new URL(safe); return safe; } catch { return null; }
  };

  const safeWebsite = localClient.website ? normalizeUrl(localClient.website) : null;

  const initials = (localClient.company_name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Client details: ${localClient.company_name || 'Unnamed'}`}
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-[#1E293B] border-l border-[rgba(255,255,255,0.08)] shadow-2xl overflow-y-auto"
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#1E293B] border-b border-[rgba(255,255,255,0.06)] px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-white">Client Details</h2>
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
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 flex items-center justify-center text-xl font-bold text-[#10B981] shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-white truncate">{localClient.company_name || 'Unnamed'}</p>
                <p className="text-sm text-slate-400 truncate">{localClient.industry || 'No industry'}</p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border shrink-0"
                style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '15', color: statusStyle.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.color }} />
                {localClient.status}
              </span>
            </div>

            <div className="flex gap-2">
              {localClient.email && (
                <a
                  href={`mailto:${localClient.email}`}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:border-[rgba(255,255,255,0.18)] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              <button
                onClick={() => localClient.email && copyToClipboard(localClient.email, 'email')}
                className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:border-[rgba(255,255,255,0.18)] transition-all cursor-pointer whitespace-nowrap"
              >
                {copiedField === 'email' ? <><Check className="w-4 h-4 text-[#10B981]" /><span className="text-[#10B981]">Copied</span></> : 'Copy Email'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Contact', value: localClient.contact_name, icon: User },
                { label: 'Email', value: localClient.email, icon: Mail },
                { label: 'Phone', value: localClient.phone, icon: Phone },
                { label: 'Website', value: safeWebsite ? (safeWebsite.replace(/^https?:\/\//, '')) : null, icon: Globe },
                { label: 'Address', value: localClient.address, icon: MapPin },
                { label: 'Industry', value: localClient.industry, icon: Building2 },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="text-sm font-medium text-slate-300 truncate">{item.value || '\u2014'}</p>
                  </div>
                </div>
              ))}
            </div>

            {safeWebsite && (
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:border-[rgba(255,255,255,0.18)] transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {localClient.notes && (
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                <div className="p-4 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {localClient.notes}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Added</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-300">{formatDate(localClient.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Last Updated</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-300">{formatDate(localClient.updated_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Linked Projects</p>
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-300">{localClient.project_count || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Relationship Lead</p>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-300">{leadStaff?.full_name || 'Unassigned'}</p>
                </div>
              </div>
            </div>

            {canEdit && (
              <>
                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Relationship Lead</p>
                  <div className="relative">
                    <select
                      value={localClient.project_lead || ''}
                      onChange={(e) => handleAssignLead(e.target.value)}
                      disabled={assigning}
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 cursor-pointer appearance-none pr-8 disabled:opacity-50"
                    >
                      <option value="" className="bg-[#1E293B]">Unassigned</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#1E293B]">{s.full_name || 'Unknown'} ({s.role})</option>
                      ))}
                    </select>
                    {assigning && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {CLIENT_STATUSES.map(s => {
                      const st = getStatusStyle(s);
                      const isOnHoldOrInactive = s === 'on_hold' || s === 'inactive';
                      const isCurrentlyActive = localClient.status === 'active';
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            if (isOnHoldOrInactive && isCurrentlyActive && localClient.project_count > 0) {
                              if (!confirm(`This client has ${localClient.project_count} active project(s). Marking as "${s}" will not delete projects. Continue?`)) return;
                            }
                            handleStatusChange(s);
                          }}
                          disabled={statusChanging || localClient.status === s}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          style={{
                            borderColor: localClient.status === s ? st.color + '40' : 'rgba(255,255,255,0.1)',
                            backgroundColor: localClient.status === s ? st.color + '15' : 'transparent',
                            color: localClient.status === s ? st.color : '#94A3B8',
                          }}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
              {canEdit && (
                <button
                  onClick={() => onEdit(localClient)}
                  className="flex items-center gap-2 px-5 py-3 border border-[rgba(255,255,255,0.12)] rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Edit2 className="w-4 h-4" /> Edit Client
                </button>
              )}
              <Link
                href={`/staff/projects?client=${localClient.id}`}
                className="flex items-center gap-2 px-5 py-3 border border-[rgba(255,255,255,0.12)] rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
              >
                <FolderKanban className="w-4 h-4" /> View Projects
              </Link>
              <Link
                href={`/staff/projects/new?client=${localClient.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-[#06B6D4] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap ml-auto"
              >
                <ArrowRight className="w-4 h-4" /> Start Project
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
