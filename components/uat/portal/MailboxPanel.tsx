'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatMessageTypeLabel, formatStatusLabel, getStatusColor,
  maskEmail, maskPhone,
} from '@/lib/uat-communications/adapters/base';
import type { UATSandboxMessage, MailboxStats, MessageFilter } from '@/lib/uat-communications/types';
import { filterMessages } from '@/hooks/useMailbox';
import {
  Mail, MessageSquare, Webhook, Ban, CheckCircle, XCircle,
  Search, RefreshCw, Inbox, ArrowLeft, Link2, Flag,
  Eye, Download, AlertTriangle, ChevronRight, Clock,
} from 'lucide-react';

interface MailboxPanelProps {
  assignmentId: string;
  messages: UATSandboxMessage[];
  stats: MailboxStats;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onLinkToTestCase: (messageId: string, caseId: string) => Promise<any>;
  onLinkToFeedback: (messageId: string, feedbackId: string) => Promise<any>;
  onMarkReviewed: (messageId: string) => Promise<any>;
  testCases: Array<{ id: string; reference: string; title: string }>;
  feedbackItems: Array<{ id: string; title: string }>;
}

const FILTER_BUTTONS: { key: MessageFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Inbox className="w-3.5 h-3.5" /> },
  { key: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
  { key: 'sms', label: 'SMS', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: 'webhook', label: 'Webhook', icon: <Webhook className="w-3.5 h-3.5" /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  { key: 'failed', label: 'Failed', icon: <XCircle className="w-3.5 h-3.5" /> },
  { key: 'blocked', label: 'Blocked', icon: <Ban className="w-3.5 h-3.5" /> },
];

function getTypeIcon(type: string) {
  switch (type) {
    case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
    case 'sms': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    case 'webhook': return <Webhook className="w-4 h-4 text-purple-500" />;
    default: return <Mail className="w-4 h-4 text-slate-400" />;
  }
}

export default function MailboxPanel({
  assignmentId, messages, stats, loading, error,
  onRefresh, onLinkToTestCase, onLinkToFeedback, onMarkReviewed,
  testCases, feedbackItems,
}: MailboxPanelProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [linkingAction, setLinkingAction] = useState<'case' | 'feedback' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => filterMessages(messages, filter, searchQuery), [messages, filter, searchQuery]);
  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  const handleLink = async (targetId: string) => {
    if (!selectedMessageId) return;
    setActionLoading(true);
    try {
      if (linkingAction === 'case') {
        await onLinkToTestCase(selectedMessageId, targetId);
      } else if (linkingAction === 'feedback') {
        await onLinkToFeedback(selectedMessageId, targetId);
      }
    } finally {
      setActionLoading(false);
      setLinkingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push(`/uat/my-tests/${assignmentId}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2878d0] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-slate-500">Emails</span>
          </div>
          <p className="text-lg font-bold text-[#17325c]">{stats.email}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-slate-500">SMS</span>
          </div>
          <p className="text-lg font-bold text-[#17325c]">{stats.sms}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Webhook className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-slate-500">Webhooks</span>
          </div>
          <p className="text-lg font-bold text-[#17325c]">{stats.webhook}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-slate-500">Blocked</span>
          </div>
          <p className="text-lg font-bold text-[#17325c]">{stats.blocked}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject, sender, recipient..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40"
          />
        </div>
        <button onClick={onRefresh} disabled={loading}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:text-[#2878d0] transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_BUTTONS.map((fb) => (
          <button key={fb.key} onClick={() => setFilter(fb.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
              filter === fb.key
                ? 'bg-[#edf5ff] text-[#2878d0] border-[#2878d0]/20'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
            }`}>
            {fb.icon} {fb.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Message List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No messages</p>
            </div>
          )}

          {loading && messages.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading mailbox...</p>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {filtered.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedMessageId === msg.id ? 'bg-[#edf5ff]/60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(msg.message_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[#17325c] truncate">{msg.subject || msg.safe_preview || 'No subject'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${getStatusColor(msg.status)}`}>
                        {formatStatusLabel(msg.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {msg.sender_address || 'Unknown'} → {msg.recipient_address || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.intercepted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.linked_cases > 0 && (
                        <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Case linked</span>
                      )}
                      {msg.linked_feedback > 0 && (
                        <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Bug linked</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {!selectedMessage && (
            <div className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Select a message to view details</p>
              </div>
            </div>
          )}

          {selectedMessage && (
            <div className="h-full flex flex-col">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    {getTypeIcon(selectedMessage.message_type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#17325c]">
                      {selectedMessage.subject || selectedMessage.safe_preview || 'No subject'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${getStatusColor(selectedMessage.status)}`}>
                        {formatStatusLabel(selectedMessage.status)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatMessageTypeLabel(selectedMessage.message_type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {selectedMessage.sender_address && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16 shrink-0">From</span>
                      <span className="text-slate-700">{selectedMessage.sender_address}</span>
                    </div>
                  )}
                  {selectedMessage.recipient_address && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16 shrink-0">To</span>
                      <span className="text-slate-700">{selectedMessage.recipient_address}</span>
                      {selectedMessage.recipient_display && selectedMessage.recipient_display !== selectedMessage.recipient_address && (
                        <span className="text-[10px] text-slate-400">({selectedMessage.recipient_display})</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0">Time</span>
                    <span className="text-slate-700">
                      {new Date(selectedMessage.intercepted_at).toLocaleString('en-GB')}
                    </span>
                  </div>
                  {selectedMessage.provider_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-16 shrink-0">Provider</span>
                      <span className="text-slate-700">{selectedMessage.provider_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto">
                {/* Plain text content */}
                {selectedMessage.content_text && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Content</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedMessage.content_text}
                    </div>
                  </div>
                )}

                {/* Safe HTML preview */}
                {selectedMessage.content_html_reference && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">HTML Preview</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-slate-500">Sandboxed preview — scripts and forms disabled</span>
                      </div>
                      <iframe
                        srcDoc={`<base target="_blank"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;"><style>body{font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#333;padding:16px;margin:0}a{color:#2878d0}</style>${selectedMessage.content_html_reference}`}
                        sandbox="allow-same-origin"
                        className="w-full h-64 border-0"
                        title="Email preview"
                      />
                    </div>
                  </div>
                )}

                {/* Webhook safe summary */}
                {selectedMessage.message_type === 'webhook' && selectedMessage.safe_preview && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Webhook Summary</h4>
                    <pre className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 overflow-x-auto">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedMessage.safe_preview), null, 2);
                        } catch {
                          return selectedMessage.safe_preview;
                        }
                      })()}
                    </pre>
                  </div>
                )}

                {/* Attachments placeholder */}
                {selectedMessage.attachment_count > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attachments</h4>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{selectedMessage.attachment_count} attachment(s)</span>
                      <span className="text-[10px] text-slate-400">Download via staff interface</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap gap-2">
                  {selectedMessage.status !== 'reviewed' && (
                    <button onClick={() => onMarkReviewed(selectedMessage.id)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-[#2878d0] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                      <Eye className="w-3.5 h-3.5" /> Mark Reviewed
                    </button>
                  )}
                  <button onClick={() => setLinkingAction('case')}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-[#2878d0] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <Link2 className="w-3.5 h-3.5" /> Link to Case
                  </button>
                  <button onClick={() => setLinkingAction('feedback')}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-[#2878d0] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                      <Flag className="w-3.5 h-3.5" /> Link to Bug
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {linkingAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setLinkingAction(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#17325c]">
                {linkingAction === 'case' ? 'Link to Test Case' : 'Link to Bug Report'}
              </h3>
            </div>
            <div className="p-3">
              {(linkingAction === 'case' ? testCases : feedbackItems).length === 0 && (
                <p className="text-sm text-slate-500 p-3">No items available</p>
              )}
              {(linkingAction === 'case' ? testCases : feedbackItems).map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => handleLink(item.id)}
                  disabled={actionLoading}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 border-b border-slate-50 last:border-0"
                >
                  <p className="text-sm font-medium text-slate-700">{item.title || item.reference || 'Untitled'}</p>
                  {item.reference && <p className="text-xs text-slate-400 mt-0.5">{item.reference}</p>}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button onClick={() => setLinkingAction(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-pointer whitespace-nowrap">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}