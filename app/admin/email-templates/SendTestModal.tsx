'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { X, Send, Mail, User, ChevronDown, Search } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[] | null;
}

interface Client {
  id: string;
  email: string;
  full_name: string;
}

interface Props {
  template: EmailTemplate;
  onClose: () => void;
  onSent: () => void;
}

export default function SendTestModal({ template, onClose, onSent }: Props) {
  const [to, setTo] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, email, contact_name').order('contact_name');
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

  const selectClient = (client: Client) => {
    setTo(client.email);
    setSearchClient('');
    setShowClientDropdown(false);
    setVariableValues((prev) => ({ ...prev, client_name: client.full_name }));
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
    if (!to.trim()) {
      setError('Please enter a recipient email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setSending(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-template-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        template_id: template.id,
        to: to.trim(),
        variables: variableValues,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      setError(result.error || 'Failed to send email');
      setSending(false);
      return;
    }

    setSending(false);
    onSent();
  };

  const preview = renderPreview();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-xl my-4"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
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
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Recipient</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={to} onChange={(e) => setTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div className="relative">
                <button onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">From Clients</span>
                </button>
                {showClientDropdown && (
                  <div className="absolute right-0 top-12 w-72 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 overflow-hidden">
                    <div className="p-2 border-b border-[rgba(255,255,255,0.06)]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                          placeholder="Search clients..."
                          className="w-full pl-8 pr-3 py-2 bg-white/5 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none"
                          onFocus={() => setShowClientDropdown(true)}
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <p className="text-xs text-slate-500 p-3 text-center">No clients found</p>
                      ) : (
                        filteredClients.map((c) => (
                          <button key={c.id} onClick={() => selectClient(c)}
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
            </div>
          </div>

          {(template.variables || []).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Variable Values</label>
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
              <div className="mt-2 bg-white rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden h-64">
                <div className="bg-slate-100 px-4 py-2 border-b text-xs text-slate-600 font-medium">
                  Subject: {preview.subject}
                </div>
                <iframe srcDoc={preview.html} className="w-full h-[calc(100%-36px)]" title="Send Preview" sandbox="allow-same-origin" />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-[rgba(255,255,255,0.08)]">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending}
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
      </motion.div>
    </motion.div>
  );
}
