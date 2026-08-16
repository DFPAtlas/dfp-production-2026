'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { X, Send, Mail, User, Search, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';
import { EditorDocument } from './editor-types';
import { renderDocumentToHtml } from './editor-utils';
import { ValidationResult, runValidation } from './email-validator';

interface Client {
  id: string;
  email: string;
  full_name: string;
}

interface EnhancedSendTestProps {
  template: { id: string; name: string; subject: string; html_content: string; variables: string[] | null; category?: string };
  document?: EditorDocument | null;
  brandKitId?: string | null;
  onClose: () => void;
  onSent: () => void;
}

const MAX_RECIPIENTS = 5;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_PER_WINDOW = 10;

export default function EnhancedSendTestModal({ template, document: editorDocument, brandKitId, onClose, onSent }: EnhancedSendTestProps) {
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [searchClient, setSearchClient] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, email, contact_name').order('contact_name').limit(50);
      if (data) setClients(data.map(c => ({ id: c.id, email: c.email, full_name: c.contact_name || c.email })));
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchClient) {
      setFilteredClients(clients.filter((c) =>
        c.full_name.toLowerCase().includes(searchClient.toLowerCase()) ||
        c.email.toLowerCase().includes(searchClient.toLowerCase())
      ));
    } else {
      setFilteredClients(clients.slice(0, 10));
    }
  }, [searchClient, clients]);

  useEffect(() => {
    const init: Record<string, string> = {};
    (template.variables || []).forEach((v) => { init[v] = ''; });
    setVariableValues(init);
  }, [template]);

  useEffect(() => {
    if (editorDocument) {
      const html = renderDocumentToHtml(editorDocument);
      const result = runValidation({
        document: editorDocument,
        templateName: template.name,
        subject: template.subject,
        category: template.category || 'general',
        previewText: '',
        htmlContent: html,
        brandKitId: brandKitId || null,
        isLegacy: false,
      });
      setValidationResult(result);
      if (result.errors.length > 0) {
        setShowValidationWarning(true);
      }
    }
  }, [editorDocument, template.name, template.subject, template.category, brandKitId]);

  const selectClient = (client: Client, index: number) => {
    const newRecipients = [...recipients];
    newRecipients[index] = client.email;
    setRecipients(newRecipients);
    setSearchClient('');
    setShowClientDropdown(false);
    setVariableValues((prev) => ({ ...prev, client_name: client.full_name }));
  };

  const addRecipient = () => {
    if (recipients.length < MAX_RECIPIENTS) {
      setRecipients([...recipients, '']);
    }
  };

  const removeRecipient = (index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    if (newRecipients.length === 0) newRecipients.push('');
    setRecipients(newRecipients);
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const renderPreview = () => {
    let html = template.html_content;
    let subject = template.subject;
    for (const [key, value] of Object.entries(variableValues)) {
      const val = value || `{{${key}}}`;
      html = html.replaceAll(`{{${key}}}`, val);
      html = html.replaceAll(`{{ ${key} }}`, val);
      subject = subject.replaceAll(`{{${key}}}`, val);
      subject = subject.replaceAll(`{{ ${key} }}`, val);
    }
    return { html, subject };
  };

  const handleSend = async () => {
    const validRecipients = recipients.filter(r => r.trim()).filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.trim()));

    if (validRecipients.length === 0) {
      setError('Please enter at least one valid recipient email');
      return;
    }

    if (validationResult && validationResult.errors.length > 0) {
      setError('Cannot send test: template has critical validation errors.');
      setShowValidationWarning(true);
      return;
    }

    const unresolvedTags = (template.variables || []).filter(v => !variableValues[v]);
    if (unresolvedTags.length > 0) {
      setError(`Please provide values for: ${unresolvedTags.map(t => `{{${t}}}`).join(', ')}`);
      return;
    }

    setSending(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    let allSuccess = true;
    let lastProviderId = '';
    const failedRecipients: string[] = [];

    for (const recipient of validRecipients) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-template-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: template.id,
          to: recipient.trim(),
          variables: variableValues,
          subject_prefix: '[TEST] ',
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        allSuccess = false;
        failedRecipients.push(recipient);
        lastProviderId = result.error || 'Unknown error';
      } else {
        lastProviderId = result.id || result.message_id || '';
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    const { data: profileData } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };

    await supabase.from('email_test_sends').insert({
      template_id: template.id,
      recipient_summary: `${validRecipients.length - failedRecipients.length} sent${failedRecipients.length > 0 ? `, ${failedRecipients.length} failed` : ''}`,
      provider_message_id: lastProviderId,
      status: allSuccess ? 'sent' : 'failed',
      error_code: failedRecipients.length > 0 ? failedRecipients.join(', ') : null,
      created_by: userId,
      organisation_id: profileData?.organisation_id || null,
    });

    setSending(false);

    if (allSuccess) {
      setSuccess(true);
      setTimeout(() => { onSent(); }, 1500);
    } else {
      setError(`Sent to ${validRecipients.length - failedRecipients.length}, failed for: ${failedRecipients.join(', ')}`);
    }
  };

  const preview = renderPreview();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-xl my-4"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <h3 className="text-base font-bold text-white">Send Test Email</h3>
            <p className="text-xs text-slate-400 mt-0.5">Template: {template.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {showValidationWarning && validationResult && validationResult.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-400">Validation Errors</p>
                <p className="text-[11px] text-red-400/70 mt-0.5">
                  {validationResult.errors.length} critical issue(s) found. Test sending is blocked until errors are resolved.
                </p>
                <button onClick={() => { setShowValidationWarning(false); }}
                  className="text-[10px] text-red-400 underline mt-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Recipients</label>
              {recipients.filter(r => r.trim()).length < MAX_RECIPIENTS && (
                <button onClick={addRecipient}
                  className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer"
                >
                  + Add recipient
                </button>
              )}
            </div>
            <div className="space-y-2">
              {recipients.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={r} onChange={(e) => updateRecipient(i, e.target.value)}
                      placeholder="client@example.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                    />
                  </div>
                  {i === 0 && (
                    <div className="relative" ref={clientDropdownRef}>
                      <button onClick={() => setShowClientDropdown(!showClientDropdown)}
                        className="px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                      >
                        <User className="w-4 h-4" />
                      </button>
                      {showClientDropdown && (
                        <div className="absolute right-0 top-12 w-72 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 overflow-hidden">
                          <div className="p-2 border-b border-[rgba(255,255,255,0.06)]">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                              <input type="text" value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                                placeholder="Search clients..."
                                className="w-full pl-8 pr-3 py-2 bg-white/5 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredClients.length === 0 ? (
                              <p className="text-xs text-slate-500 p-3 text-center">No clients found</p>
                            ) : (
                              filteredClients.map((c) => (
                                <button key={c.id} onClick={() => selectClient(c, i)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.03)] last:border-0"
                                >
                                  <p className="text-sm text-white">{c.full_name}</p>
                                  <p className="text-xs text-slate-400">{c.email}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {recipients.length > 1 && (
                    <button onClick={() => removeRecipient(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {(template.variables || []).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Merge Tag Values</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(template.variables || []).map((v) => (
                  <div key={v}>
                    <label className="block text-[10px] text-slate-500 mb-0.5 font-mono">{`{{${v}}}`}</label>
                    <input type="text" value={variableValues[v] || ''}
                      onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <button onClick={() => setPreviewExpanded(!previewExpanded)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {previewExpanded ? 'Hide Preview' : 'Show Preview'}
            </button>
            {previewExpanded && (
              <div className="mt-2 bg-white rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b text-xs text-slate-600 font-medium">
                  <span className="text-amber-500 font-mono mr-1">[TEST]</span>
                  Subject: {preview.subject}
                </div>
                <div className="bg-amber-50 px-4 py-1.5 text-[10px] text-amber-600 font-medium border-b border-amber-100">
                  This is a test email from Digital Footprint Email Studio.
                </div>
                <iframe srcDoc={preview.html} className="w-full h-64" title="Send Preview" sandbox="allow-same-origin" />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-emerald-400">Test email sent successfully!</p>
              <p className="text-[11px] text-emerald-400/70 mt-0.5">Check the inbox for your test message.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Clock className="w-3 h-3" />
            Max {MAX_RECIPIENTS} recipients
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending || success}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
