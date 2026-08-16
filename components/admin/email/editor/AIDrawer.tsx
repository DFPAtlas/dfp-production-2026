'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Sparkles, X, Loader2, RefreshCw, Copy, Check, AlertTriangle,
  ChevronRight, ChevronDown, FileText, Type, Eye, MessageSquare,
  Wand2, Palette, Headphones, Zap, ArrowLeft, Plus,
} from 'lucide-react';

interface AIDrawerProps {
  open: boolean;
  onClose: () => void;
  templateId?: string;
  campaignId?: string;
  brandKitId?: string | null;
  editorDocument?: unknown;
  selectedText?: string;
  subject?: string;
  previewText?: string;
  onApplySubject?: (subject: string) => void;
  onApplyPreviewText?: (text: string) => void;
  onApplyContent?: (content: unknown) => void;
  onInsertText?: (text: string) => void;
}

type AIAction = 
  | 'subject_lines' | 'preview_text' | 'rewrite_text' | 'draft_from_brief'
  | 'cta_suggestions' | 'content_review' | 'accessibility_suggestions'
  | 'tone_consistency' | 'content_variation' | 'content_adaptation'
  | 'plain_text' | 'simplify_language' | 'make_professional'
  | 'make_friendlier' | 'shorten' | 'expand';

interface AIResult {
  loading: boolean;
  error: string;
  data: unknown;
  actionType: AIAction | null;
}

const QUICK_ACTIONS: { key: AIAction; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'rewrite_text', label: 'Rewrite Selection', icon: Wand2, description: 'Improve selected text' },
  { key: 'simplify_language', label: 'Simplify', icon: Type, description: 'Make text easier to read' },
  { key: 'shorten', label: 'Shorten', icon: ChevronDown, description: 'Make more concise' },
  { key: 'expand', label: 'Expand', icon: ChevronRight, description: 'Add more detail' },
  { key: 'make_professional', label: 'More Professional', icon: Palette, description: 'Formal tone' },
  { key: 'make_friendlier', label: 'Friendlier', icon: MessageSquare, description: 'Warm tone' },
  { key: 'content_review', label: 'Review Content', icon: Eye, description: 'Get improvement suggestions' },
  { key: 'accessibility_suggestions', label: 'Accessibility Check', icon: Headphones, description: 'Accessibility tips' },
];

const ADVANCED_ACTIONS: { key: AIAction; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'subject_lines', label: 'Subject Lines', icon: Type, description: 'Generate subject options' },
  { key: 'preview_text', label: 'Preview Text', icon: Eye, description: 'Generate preview text' },
  { key: 'draft_from_brief', label: 'Draft from Brief', icon: FileText, description: 'Full email from description' },
  { key: 'cta_suggestions', label: 'CTA Suggestions', icon: Zap, description: 'Better call-to-action text' },
  { key: 'tone_consistency', label: 'Tone Check', icon: Palette, description: 'Check brand tone consistency' },
  { key: 'content_variation', label: 'A/B Variation', icon: Copy, description: 'Create content variation' },
  { key: 'content_adaptation', label: 'Adapt for Brand', icon: Sparkles, description: 'Adapt to another brand' },
  { key: 'plain_text', label: 'Plain Text', icon: FileText, description: 'Convert to plain text' },
];

interface BriefFormData {
  purpose: string;
  audience: string;
  category: string;
  desired_action: string;
  tone: string;
  key_info: string;
  required_links: string;
  merge_tags: string;
  length: string;
  restrictions: string;
}

export default function AIDrawer({
  open, onClose, templateId, campaignId, brandKitId,
  editorDocument, selectedText, subject, previewText,
  onApplySubject, onApplyPreviewText, onApplyContent, onInsertText,
}: AIDrawerProps) {
  const [view, setView] = useState<'menu' | 'brief' | 'result' | 'textRewrite'>('menu');
  const [result, setResult] = useState<AIResult>({ loading: false, error: '', data: null, actionType: null });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [rewriteText, setRewriteText] = useState('');

  const [briefForm, setBriefForm] = useState<BriefFormData>({
    purpose: '', audience: '', category: 'marketing', desired_action: '',
    tone: 'professional', key_info: '', required_links: '', merge_tags: '',
    length: 'medium', restrictions: '',
  });

  const [brandName, setBrandName] = useState('');
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) checkConfig();
  }, [open]);

  useEffect(() => {
    if (open && brandKitId) fetchBrandName();
  }, [open, brandKitId]);

  useEffect(() => {
    if (open && selectedText) {
      setRewriteText(selectedText);
    }
  }, [open, selectedText]);

  const checkConfig = async () => {
    const { data: settings } = await supabase.from('email_studio_settings').select('ai_config').maybeSingle();
    const config = settings?.ai_config as Record<string, unknown> | null;
    setAiEnabled(config?.ai_enabled !== false);
    setAllowedModules((config?.allowed_modules as string[]) || []);
    const { data: { session } } = await supabase.auth.getSession();
    sessionRef.current = session?.access_token || null;
  };

  const fetchBrandName = async () => {
    const { data } = await supabase.from('email_brand_kits').select('name').eq('id', brandKitId).maybeSingle();
    if (data) setBrandName(data.name);
  };

  const callAI = useCallback(async (actionType: AIAction, payload: Record<string, unknown>) => {
    setResult({ loading: true, error: '', data: null, actionType });
    setView('result');

    if (!allowedModules.includes(actionType)) {
      setResult({ loading: false, error: 'This AI capability is not enabled for your organisation.', data: null, actionType });
      return;
    }

    if (!sessionRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      sessionRef.current = session?.access_token || null;
    }

    if (!sessionRef.current) {
      setResult({ loading: false, error: 'Authentication required. Please log in again.', data: null, actionType });
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionRef.current}` },
        body: JSON.stringify({
          capability: actionType,
          payload: { ...payload, template_id: templateId, campaign_id: campaignId, brand_id: brandKitId },
          template_id: templateId,
          campaign_id: campaignId,
          brand_id: brandKitId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ loading: false, error: '', data: data.result, actionType });
        if (data.warnings?.length > 0) {
          setResult(prev => ({ ...prev, error: data.warnings.join('. ') }));
        }
      } else {
        setResult({ loading: false, error: data.error || 'AI request failed', data: null, actionType });
      }
    } catch (err) {
      setResult({ loading: false, error: 'Network error. Check your connection and try again.', data: null, actionType });
    }
  }, [allowedModules, templateId, campaignId, brandKitId]);

  const handleQuickAction = (action: AIAction) => {
    if (action === 'rewrite_text' && selectedText) {
      setRewriteText(selectedText);
      setRewriteInstruction('');
      setView('textRewrite');
      return;
    }
    if (action === 'content_review' || action === 'accessibility_suggestions') {
      const content = editorDocument ? JSON.stringify(editorDocument) : '';
      callAI(action, { content, subject, preview_text: previewText });
      return;
    }
    if (selectedText) {
      callAI(action, { text: selectedText, context: subject || '' });
    } else {
      setResult({ loading: false, error: 'Select some text in the editor first to use this action.', data: null, actionType: action });
      setView('result');
    }
  };

  const handleAdvancedAction = (action: AIAction) => {
    if (action === 'draft_from_brief') {
      setView('brief');
      return;
    }
    if (action === 'subject_lines') {
      callAI(action, { purpose: subject || '', count: 8, current_subject: subject, brand_name: brandName, category: 'marketing' });
      return;
    }
    if (action === 'preview_text') {
      callAI(action, { subject, current_preview: previewText, count: 5, category: 'marketing' });
      return;
    }
    if (selectedText && (action === 'content_variation' || action === 'content_adaptation' || action === 'plain_text')) {
      callAI(action, { original: selectedText, content: selectedText, element: 'text' });
    } else if (action === 'tone_consistency') {
      const content = editorDocument ? JSON.stringify(editorDocument) : '';
      callAI(action, { content, expected_tone: 'professional' });
    } else if (action === 'cta_suggestions') {
      callAI(action, { context: subject || '', current_cta: selectedText || '' });
    } else {
      setResult({ loading: false, error: 'Select content in the editor to use this action.', data: null, actionType: action });
      setView('result');
    }
  };

  const handleRewriteSubmit = () => {
    if (!rewriteText.trim()) return;
    callAI('rewrite_text', { text: rewriteText, instruction: rewriteInstruction || 'improve clarity', context: subject || '' });
  };

  const handleDraftSubmit = () => {
    if (!briefForm.purpose.trim()) return;
    callAI('draft_from_brief', {
      ...briefForm,
      brand_name: brandName,
      merge_tags: briefForm.merge_tags,
    });
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {});
  };

  const handleApplySubject = (text: string) => {
    onApplySubject?.(text);
  };

  const handleApplyPreviewText = (text: string) => {
    onApplyPreviewText?.(text);
  };

  const handleApplyText = (text: string) => {
    onInsertText?.(text);
    onClose();
  };

  const resetState = () => {
    setView('menu');
    setResult({ loading: false, error: '', data: null, actionType: null });
    setRewriteInstruction('');
    setRewriteText('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed right-0 top-0 bottom-0 w-full lg:w-[420px] xl:w-[480px] bg-[#0d0d10] border-l border-[rgba(255,255,255,0.06)] z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
              <div className="flex items-center gap-2">
                {view !== 'menu' && (
                  <button onClick={() => { setView('menu'); setResult({ loading: false, error: '', data: null, actionType: null }); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                  {brandName && <p className="text-[10px] text-slate-500">{brandName}</p>}
                </div>
              </div>
              <button onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!aiEnabled ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">AI Assistant Not Configured</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    The AI assistant needs to be enabled and configured by an administrator before it can be used.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {view === 'menu' && (
                  <div className="p-4 space-y-6">
                    {selectedText && (
                      <div className="bg-[#06B6D4]/[0.04] border border-[#06B6D4]/10 rounded-xl p-3">
                        <p className="text-[10px] text-[#06B6D4] uppercase tracking-wider mb-1">Selected Text</p>
                        <p className="text-xs text-slate-300 line-clamp-3">{selectedText}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.filter(a => allowedModules.includes(a.key)).map(action => (
                          <button key={action.key} onClick={() => handleQuickAction(action.key)}
                            disabled={!selectedText && !['content_review', 'accessibility_suggestions'].includes(action.key)}
                            className="flex flex-col items-start gap-1 p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.05)] rounded-xl hover:border-[rgba(255,255,255,0.1)] hover:bg-white/[0.04] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-left"
                          >
                            <action.icon className="w-4 h-4 text-[#06B6D4]" />
                            <span className="text-xs font-medium text-white">{action.label}</span>
                            <span className="text-[10px] text-slate-500">{action.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Advanced</p>
                      <div className="space-y-1.5">
                        {ADVANCED_ACTIONS.filter(a => allowedModules.includes(a.key)).map(action => (
                          <button key={action.key} onClick={() => handleAdvancedAction(action.key)}
                            className="flex items-center gap-3 w-full p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.05)] rounded-xl hover:border-[rgba(255,255,255,0.1)] hover:bg-white/[0.04] transition-all cursor-pointer text-left"
                          >
                            <action.icon className="w-4 h-4 text-[#06B6D4] shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-white">{action.label}</span>
                              <p className="text-[10px] text-slate-500">{action.description}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {view === 'textRewrite' && (
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-bold text-white">Rewrite Text</h3>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Original Text</label>
                      <textarea value={rewriteText} onChange={(e) => setRewriteText(e.target.value)}
                        rows={5} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Instruction (optional)</label>
                      <input type="text" value={rewriteInstruction} onChange={(e) => setRewriteInstruction(e.target.value)}
                        placeholder="e.g. make it more urgent, use simpler words..."
                        className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                      />
                    </div>
                    <button onClick={handleRewriteSubmit} disabled={!rewriteText.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Wand2 className="w-4 h-4" /> Rewrite
                    </button>
                  </div>
                )}

                {view === 'brief' && (
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-bold text-white">Draft from Brief</h3>
                    <p className="text-xs text-slate-500 -mt-2">Describe what you need and the AI will generate a complete email draft.</p>
                    {[
                      { key: 'purpose' as const, label: 'Purpose *', placeholder: 'e.g. Announce product launch to existing customers' },
                      { key: 'audience' as const, label: 'Audience', placeholder: 'e.g. Existing customers who purchased in last 6 months' },
                      { key: 'desired_action' as const, label: 'Desired Action', placeholder: 'e.g. Visit the new product page and sign up for early access' },
                      { key: 'key_info' as const, label: 'Key Information', placeholder: 'Key facts, features, or details to include...', textarea: true },
                      { key: 'required_links' as const, label: 'Required Links', placeholder: 'e.g. https://example.com/product' },
                      { key: 'merge_tags' as const, label: 'Merge Tags', placeholder: 'e.g. first_name, company_name' },
                      { key: 'restrictions' as const, label: 'Restrictions', placeholder: 'Things to avoid or exclude...' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">{field.label}</label>
                        {field.textarea ? (
                          <textarea value={briefForm[field.key]} onChange={(e) => setBriefForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            rows={3} placeholder={field.placeholder} maxLength={500}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                          />
                        ) : (
                          <input type="text" value={briefForm[field.key]} onChange={(e) => setBriefForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                          />
                        )}
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Tone</label>
                        <select value={briefForm.tone} onChange={(e) => setBriefForm(prev => ({ ...prev, tone: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="warm">Warm</option>
                          <option value="concise">Concise</option>
                          <option value="reassuring">Reassuring</option>
                          <option value="premium">Premium</option>
                          <option value="informative">Informative</option>
                          <option value="urgent_calm">Urgent but Calm</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Category</label>
                        <select value={briefForm.category} onChange={(e) => setBriefForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                        >
                          <option value="marketing">Marketing</option>
                          <option value="transactional">Transactional</option>
                          <option value="newsletter">Newsletter</option>
                          <option value="announcement">Announcement</option>
                          <option value="onboarding">Onboarding</option>
                          <option value="reengagement">Re-engagement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Length</label>
                        <select value={briefForm.length} onChange={(e) => setBriefForm(prev => ({ ...prev, length: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                        >
                          <option value="short">Short</option>
                          <option value="medium">Medium</option>
                          <option value="long">Long</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleDraftSubmit} disabled={!briefForm.purpose.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Draft
                    </button>
                  </div>
                )}

                {view === 'result' && (
                  <div className="p-4 space-y-4">
                    {result.loading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center mb-4">
                          <Sparkles className="w-6 h-6 text-[#06B6D4] animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-white mb-1">Generating...</p>
                        <p className="text-xs text-slate-500">
                          {result.actionType === 'subject_lines' && 'Creating subject line options'}
                          {result.actionType === 'preview_text' && 'Creating preview text options'}
                          {result.actionType === 'draft_from_brief' && 'Drafting email from brief'}
                          {result.actionType === 'content_review' && 'Analysing content'}
                          {!['subject_lines', 'preview_text', 'draft_from_brief', 'content_review'].includes(result.actionType || '') && 'Processing your request'}
                        </p>
                        <div className="w-32 h-1 bg-white/[0.04] rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-[#06B6D4]/50 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    ) : result.error ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <p className="text-sm font-medium text-white mb-1">Something went wrong</p>
                        <p className="text-xs text-slate-400 text-center max-w-xs">{result.error}</p>
                        <button onClick={() => { setView('menu'); setResult({ loading: false, error: '', data: null, actionType: null }); }}
                          className="mt-4 px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : result.data ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">Generated successfully</span>
                        </div>

                        {result.actionType === 'subject_lines' && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">Click a subject line to apply it</p>
                            {Array.isArray((result.data as Record<string, unknown>).subject_options) && ((result.data as Record<string, unknown>).subject_options as Array<Record<string, unknown>>).map((opt: Record<string, unknown>, i: number) => {
                              const text = (opt.subject || opt.text || '') as string;
                              return (
                                <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 group hover:border-[#06B6D4]/20 transition-all">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm text-white">{text}</p>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                        {opt.character_count != null && <span>{String(opt.character_count)} chars</span>}
                                        {opt.tone != null && <span className="text-[#06B6D4]">{String(opt.tone)}</span>}
                                        {opt.issues != null && <span className="text-amber-400">{String(opt.issues)}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleCopy(text, i)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                      <button onClick={() => handleApplySubject(text)}
                                        className="px-2 py-1 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                                      >Apply</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {result.actionType === 'preview_text' && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">Click a preview text to apply it</p>
                            {Array.isArray((result.data as Record<string, unknown>).preview_options) && ((result.data as Record<string, unknown>).preview_options as Array<Record<string, unknown>>).map((opt: Record<string, unknown>, i: number) => {
                              const text = (opt.text || opt.preview || '') as string;
                              return (
                                <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 group hover:border-[#06B6D4]/20 transition-all">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm text-white">{text}</p>
                                      {opt.character_count != null && <p className="text-[10px] text-slate-500 mt-0.5">{String(opt.character_count)} chars</p>}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleCopy(text, i)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                      <button onClick={() => handleApplyPreviewText(text)}
                                        className="px-2 py-1 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                                      >Apply</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {result.actionType === 'rewrite_text' && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Original</p>
                              <p className="text-sm text-slate-400 bg-white/[0.02] rounded-xl p-3">{rewriteText}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Suggested</p>
                              <div className="bg-[#06B6D4]/[0.04] border border-[#06B6D4]/10 rounded-xl p-3">
                                <p className="text-sm text-white">{((result.data as Record<string, unknown>).suggested_text as string) || 'No suggestion generated'}</p>
                              </div>
                              {(result.data as Record<string, unknown>).changes_summary != null && (
                                <p className="text-[10px] text-slate-500 mt-1">{(result.data as Record<string, unknown>).changes_summary as string}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleApplyText(((result.data as Record<string, unknown>).suggested_text as string) || '')}
                                className="flex-1 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                              >Apply & Close</button>
                              <button onClick={() => {
                                const text = ((result.data as Record<string, unknown>).suggested_text as string) || '';
                                navigator.clipboard.writeText(text).catch(() => {});
                              }}
                                className="px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                              ><Copy className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}

                        {result.actionType === 'draft_from_brief' && (
                          <div className="space-y-4">
                            {Array.isArray((result.data as Record<string, unknown>).subject_options) && (
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Subject Line Options</p>
                                <div className="space-y-1">
                                  {((result.data as Record<string, unknown>).subject_options as Array<Record<string, unknown>>).map((s: Record<string, unknown>, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
                                      <span className="text-xs text-white">{s.subject as string}</span>
                                      <button onClick={() => handleApplySubject(s.subject as string)}
                                        className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap"
                                      >Use</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(result.data as Record<string, unknown>).body != null && (
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Draft Body</p>
                                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                                  <p className="text-sm text-white whitespace-pre-wrap">{(result.data as Record<string, unknown>).body as string}</p>
                                </div>
                              </div>
                            )}
                            {(result.data as Record<string, unknown>).cta != null && (
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Call to Action</p>
                                <div className="bg-[#06B6D4]/[0.04] border border-[#06B6D4]/10 rounded-xl p-3">
                                  <p className="text-sm text-white">{(result.data as Record<string, unknown>).cta as string}</p>
                                </div>
                              </div>
                            )}
                            <button onClick={() => {
                              const body = (result.data as Record<string, unknown>).body as string;
                              if (body) handleApplyText(body);
                            }}
                              className="w-full py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                            >Insert Draft Content</button>
                          </div>
                        )}

                        {result.actionType === 'content_review' && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">Content improvement suggestions</p>
                            {Array.isArray((result.data as Record<string, unknown>).suggestions) && (
                              (result.data as Record<string, unknown>).suggestions as Array<Record<string, unknown>>
                            ).map((s: Record<string, unknown>, i: number) => (
                              <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    s.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    s.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>{s.severity as string}</span>
                                  <span className="text-[10px] text-slate-500">{s.type as string}</span>
                                </div>
                                <p className="text-sm text-white font-medium">{s.title as string}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{s.description as string}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {result.actionType === 'accessibility_suggestions' && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">Accessibility improvement suggestions</p>
                            {Array.isArray((result.data as Record<string, unknown>).suggestions) && (
                              (result.data as Record<string, unknown>).suggestions as Array<Record<string, unknown>>
                            ).map((s: Record<string, unknown>, i: number) => (
                              <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                                <p className="text-sm text-white font-medium">{s.title as string}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{s.description as string}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {!['subject_lines', 'preview_text', 'rewrite_text', 'draft_from_brief', 'content_review', 'accessibility_suggestions'].includes(result.actionType || '') && (
                          <div>
                            <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans break-words">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </div>
                            <button onClick={() => setView('menu')}
                              className="mt-3 w-full py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                            >Back to Menu</button>
                          </div>
                        )}

                        <button onClick={() => setView('menu')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-xl text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> New Request
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
