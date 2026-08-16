'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  ArrowLeft, Save, Check, ChevronRight, ChevronLeft,
  FileText, Mail, Users, Settings, Eye, Send, Calendar, ShieldCheck,
  Megaphone, AlertTriangle, CheckCircle2, X,
  Search, Monitor, Smartphone, Loader2, Edit3,
} from 'lucide-react';
import {
  CampaignData, CampaignType, AudienceDefinition, ExclusionDefinition,
  TrackingSettings,
  CAMPAIGN_TYPES, CAMPAIGN_STATUS_LABELS,
  defaultTrackingSettings, defaultAudienceDefinition, defaultExclusionDefinition,
} from '@/components/admin/email/campaigns/campaign-types';
import { EditorDocument, EmailTemplate } from '@/components/admin/email/editor/editor-types';
import { createDefaultDocument, renderDocumentToHtml } from '@/components/admin/email/editor/editor-utils';
import { runValidation, ValidationResult } from '@/components/admin/email/editor/email-validator';
import AIDrawer from '@/components/admin/email/editor/AIDrawer';

interface CampaignWizardProps {
  campaign: CampaignData;
  isNew: boolean;
}

const STEPS = [
  { key: 'details', label: 'Details', icon: FileText },
  { key: 'template', label: 'Template', icon: Mail },
  { key: 'content', label: 'Content', icon: Edit3 },
  { key: 'audience', label: 'Audience', icon: Users },
  { key: 'sender', label: 'Sender', icon: Settings },
  { key: 'review', label: 'Review', icon: Eye },
  { key: 'schedule', label: 'Send', icon: Send },
];

type WizardStep = typeof STEPS[number]['key'];

interface WizardState {
  name: string;
  description: string;
  campaignType: CampaignType;
  brandKitId: string | null;
  tags: string[];
  templateId: string | null;
  templateVersionId: string | null;
  editorDocument: EditorDocument | null;
  subject: string;
  previewText: string;
  audienceDefinition: AudienceDefinition;
  exclusionDefinition: ExclusionDefinition;
  senderFromName: string;
  senderFromEmail: string;
  senderReplyToName: string;
  senderReplyToEmail: string;
  trackingSettings: TrackingSettings;
  scheduleType: 'now' | 'scheduled';
  scheduledDate: string;
  scheduledTime: string;
}

export default function CampaignWizard({ campaign, isNew }: CampaignWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [brandKits, setBrandKits] = useState<{ id: string; name: string }[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatePreviewId, setTemplatePreviewId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [audienceEstimate, setAudienceEstimate] = useState<{ total: number; eligible: number; unsubscribed: number; invalid: number } | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [sending, setSending] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [sendConfirmName, setSendConfirmName] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testRecipients, setTestRecipients] = useState<string[]>(['']);
  const [testSending, setTestSending] = useState(false);
  const testVarValuesRef = useRef<Record<string, string>>({});

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const [state, setState] = useState<WizardState>({
    name: campaign.name || '',
    description: campaign.description || '',
    campaignType: (campaign.campaign_type as CampaignType) || 'marketing',
    brandKitId: campaign.brand_kit_id || null,
    tags: campaign.tags || [],
    templateId: campaign.source_template_id || null,
    templateVersionId: campaign.source_template_version_id || null,
    editorDocument: null,
    subject: '',
    previewText: '',
    audienceDefinition: defaultAudienceDefinition(),
    exclusionDefinition: defaultExclusionDefinition(),
    senderFromName: 'Digital Footprint',
    senderFromEmail: 'noreply@digital-footprint.uk',
    senderReplyToName: '',
    senderReplyToEmail: '',
    trackingSettings: defaultTrackingSettings(),
    scheduleType: 'now',
    scheduledDate: '',
    scheduledTime: '',
  });

  const updateState = useCallback((patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: brandData } = await supabase.from('email_brand_kits').select('id, name').in('status', ['active', 'draft']).order('name');
      if (brandData) setBrandKits(brandData as { id: string; name: string }[]);

      setTemplatesLoading(true);
      const { data: tmplData } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
      if (tmplData) setTemplates(tmplData as EmailTemplate[]);
      setTemplatesLoading(false);
    };
    fetchData();
  }, []);

  const saveDraft = useCallback(async (patch?: Partial<WizardState>) => {
    setSaving(true);
    const current = patch ? { ...state, ...patch } : state;
    if (patch) setState(current);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profileData } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };

    const updates: Record<string, unknown> = {
      name: current.name.trim(),
      description: current.description,
      brand_kit_id: current.brandKitId,
      campaign_type: current.campaignType,
      source_template_id: current.templateId,
      source_template_version_id: current.templateVersionId,
      tags: current.tags,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (campaign.id) {
      await supabase.from('email_campaigns').update(updates).eq('id', campaign.id);
    } else {
      updates.organisation_id = profileData?.organisation_id || null;
      updates.created_by = userId;
      updates.status = 'draft';
      const { data: newData } = await supabase.from('email_campaigns').insert(updates).select('id').single();
      if (newData) {
        campaign.id = newData.id;
        router.replace(`/admin/email/campaigns/${newData.id}`);
      }
    }
    setSaving(false);
    setStatusMsg({ type: 'success', text: 'Draft saved' });
    setTimeout(() => setStatusMsg(null), 2000);
  }, [state, campaign, router]);

  const handleSelectTemplate = useCallback(async (template: EmailTemplate) => {
    const { data: versionData } = await supabase.from('email_template_versions')
      .select('*').eq('template_id', template.id).order('version_number', { ascending: false }).limit(1);

    updateState({
      templateId: template.id,
      templateVersionId: versionData && versionData.length > 0 ? versionData[0].id : null,
      editorDocument: template.editor_document || createDefaultDocument(),
      subject: template.subject,
      previewText: template.preview_text || '',
    });

    await saveDraft({
      templateId: template.id,
      templateVersionId: versionData && versionData.length > 0 ? versionData[0].id : null,
      editorDocument: template.editor_document || createDefaultDocument(),
      subject: template.subject,
      previewText: template.preview_text || '',
    });
  }, [updateState, saveDraft]);

  const computeAudienceEstimate = useCallback(async () => {
    setEstimating(true);
    const { count: totalCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: unsubCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('do_not_contact', true);
    const { count: invalidCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).or('email.is.null,email.eq.');
    const total = totalCount || 0;
    const unsub = unsubCount || 0;
    const invalid = invalidCount || 0;
    const eligible = Math.max(0, total - unsub - invalid);
    setAudienceEstimate({ total, eligible, unsubscribed: unsub, invalid });
    setEstimating(false);
  }, []);

  useEffect(() => {
    if (currentStep === 'audience' && !audienceEstimate) computeAudienceEstimate();
  }, [currentStep, audienceEstimate, computeAudienceEstimate]);

  const handleRunValidation = useCallback(() => {
    if (!state.editorDocument) return;
    const html = renderDocumentToHtml(state.editorDocument);
    const result = runValidation({
      document: state.editorDocument,
      templateName: state.name || 'Campaign',
      subject: state.subject,
      category: 'marketing',
      previewText: state.previewText,
      htmlContent: html,
      brandKitId: state.brandKitId,
      isLegacy: false,
    });
    setValidationResult(result);
  }, [state]);

  const handleSendNow = useCallback(async () => {
    if (!campaign.id) return;
    if (!state.templateId) { setError('No template selected for this campaign'); return; }

    const { data: settings } = await supabase.from('email_studio_settings').select('pilot_config').maybeSingle();
    const pilotConfig = settings?.pilot_config as Record<string, unknown> | null;
    const killSwitch = pilotConfig?.kill_switch as Record<string, unknown> | null;
    if (killSwitch?.campaigns_blocked) {
      setError('Campaign sending is blocked by the pilot kill switch. Contact the pilot owner to resume.');
      setSendConfirmOpen(false);
      return;
    }

    setSending(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profileData } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };

    const idempotencyKey = `campaign-${campaign.id}-${Date.now()}`;

    const { data: jobData, error: jobError } = await supabase.from('email_campaign_send_jobs').insert({
      campaign_id: campaign.id,
      status: 'pending',
      estimated_recipients: audienceEstimate?.eligible || 0,
      idempotency_key: idempotencyKey,
      created_by: userId,
      organisation_id: profileData?.organisation_id || null,
    }).select('id').single();

    if (jobError) {
      setError('Failed to create send job: ' + jobError.message);
      setSending(false);
      return;
    }

    await supabase.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id);

    const SEND_BATCH_LIMIT = 10;
    const { data: leads } = await supabase.from('leads').select('email, name')
      .eq('do_not_contact', false).eq('consent_marketing', true)
      .not('email', 'is', null).neq('email', '').limit(SEND_BATCH_LIMIT);

    let sentCount = 0;
    let failCount = 0;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (leads && leads.length > 0) {
      for (const lead of leads) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-template-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              template_id: state.templateId,
              to: lead.email,
              variables: { name: lead.name || '', first_name: lead.name?.split(' ')[0] || '' },
              subject_prefix: '',
              subject_override: state.subject || undefined,
              preview_text_override: state.previewText || undefined,
            }),
          });
          const result = await res.json();
          if (res.ok && result.success) sentCount++; else failCount++;
        } catch { failCount++; }
      }
    }

    await supabase.from('email_campaign_send_jobs').update({
      status: failCount === 0 ? 'completed' : 'failed',
      submitted_count: sentCount + failCount,
      delivered_count: sentCount,
      failed_count: failCount,
      completed_at: new Date().toISOString(),
    }).eq('id', jobData?.id);

    await supabase.from('email_campaigns').update({
      status: failCount === 0 ? 'sent' : 'failed',
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id);

    setSending(false);
    setSendConfirmOpen(false);
    setStatusMsg({ type: failCount === 0 ? 'success' : 'error', text: failCount === 0 ? `Campaign sent to ${sentCount} recipients` : `Sent ${sentCount}, failed ${failCount}` });
    setTimeout(() => setStatusMsg(null), 5000);
  }, [campaign.id, state.templateId, audienceEstimate]);

  const handleSendTest = useCallback(async () => {
    const validRecipients = testRecipients.filter(r => r.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.trim()));
    if (validRecipients.length === 0) { setError('Enter at least one valid email'); return; }
    if (!state.templateId) { setError('No template selected'); return; }

    const { data: settings } = await supabase.from('email_studio_settings').select('pilot_config').maybeSingle();
    const pilotConfig = settings?.pilot_config as Record<string, unknown> | null;
    const killSwitch = pilotConfig?.kill_switch as Record<string, unknown> | null;
    if (killSwitch?.campaigns_blocked) {
      setError('Test sending is blocked by the pilot kill switch.');
      return;
    }

    setTestSending(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    let allOk = true;
    for (const recipient of validRecipients) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-template-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template_id: state.templateId,
          to: recipient.trim(),
          subject_prefix: '[TEST] ',
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) allOk = false;
    }
    setTestSending(false);
    setStatusMsg({ type: allOk ? 'success' : 'error', text: allOk ? 'Test emails sent' : 'Some test emails failed' });
    setTimeout(() => setStatusMsg(null), 3000);
  }, [state.templateId, testRecipients]);

  const goToStep = (step: WizardStep) => {
    if (currentStep === 'details') saveDraft();
    setCurrentStep(step);
    setError('');
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 'details': return state.name.trim().length > 0;
      case 'template': return !!state.templateId;
      case 'content': return !!state.editorDocument;
      case 'audience': return true;
      case 'sender': return state.senderFromEmail.trim().length > 0;
      case 'review': return true;
      default: return true;
    }
  };

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  const filteredTemplates = templates.filter(t =>
    !templateSearch
    || t.name.toLowerCase().includes(templateSearch.toLowerCase())
    || t.subject.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-3 flex items-center gap-4">
        <Link href="/admin/email/campaigns" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" />
          Campaigns
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-medium text-white truncate">{state.name || 'New Campaign'}</span>
        <div className="ml-auto flex items-center gap-2">
          {statusMsg && (
            <span className={`text-[11px] ${statusMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {statusMsg.text}
            </span>
          )}
          <button onClick={() => saveDraft()} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-lg text-xs font-medium hover:bg-white/[0.08] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      <div className="border-b border-[rgba(255,255,255,0.06)] px-5">
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const isActive = step.key === currentStep;
            const isDone = stepIndex > i;
            const Icon = step.icon;
            return (
              <button key={step.key} onClick={() => goToStep(step.key as WizardStep)}
                className={`flex items-center gap-2 px-3 py-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-[1px] ${
                  isActive
                    ? 'text-[#06B6D4] border-[#06B6D4]'
                    : isDone
                      ? 'text-emerald-400 border-emerald-500/30'
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-5 mt-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>
        )}

        {currentStep === 'details' && (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Campaign Details</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Name *</label>
              <input type="text" value={state.name} onChange={(e) => updateState({ name: e.target.value })}
                placeholder="e.g. July Product Launch"
                maxLength={100}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Type</label>
              <select value={state.campaignType} onChange={(e) => updateState({ campaignType: e.target.value as CampaignType })}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
              >
                {CAMPAIGN_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Brand</label>
              <select value={state.brandKitId || ''} onChange={(e) => updateState({ brandKitId: e.target.value || null })}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
              >
                <option value="">DFP Default</option>
                {brandKits.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={state.description} onChange={(e) => updateState({ description: e.target.value })}
                placeholder="Internal description of this campaign..."
                rows={3} maxLength={500}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2">
                {(state.tags || []).map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs">
                    {tag}
                    <button onClick={() => updateState({ tags: state.tags.filter((_, j) => j !== i) })}
                      className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  placeholder="Add tag..."
                  className="px-2.5 py-1 bg-white/[0.03] border border-dashed border-[rgba(255,255,255,0.1)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40 min-w-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) { updateState({ tags: [...(state.tags || []), val] }); (e.target as HTMLInputElement).value = ''; }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'template' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Choose Template</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 w-64"
                />
              </div>
            </div>

            {templatesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No approved templates found</p>
                <Link href="/admin/email/templates" className="text-xs text-[#06B6D4] hover:underline mt-1 inline-block">Go to templates</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((t) => {
                  const isSelected = state.templateId === t.id;
                  return (
                    <div key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`bg-[#121215] border rounded-2xl overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'border-[#06B6D4] ring-1 ring-[#06B6D4]/30' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <div className="h-32 bg-white/[0.02] relative overflow-hidden">
                        <div className="absolute inset-0 p-3 scale-[0.3] origin-top-left w-[333%]">
                          <div className="max-w-[600px] text-[6px] leading-tight text-slate-600" dangerouslySetInnerHTML={{ __html: t.html_content.slice(0, 400) }} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#121215] to-transparent" />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#06B6D4] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-white truncate">{t.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t.subject}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-[10px] text-slate-400 capitalize">{t.category}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px]">
                            {t.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentStep === 'content' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Campaign Content</h2>
                {state.templateId && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Based on template: {templates.find(t => t.id === state.templateId)?.name || 'Unknown'} (version snapshot)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center">✨</span>
                  AI Assistant
                </button>
                <button onClick={handleRunValidation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Validate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject Line</label>
                <input type="text" value={state.subject} onChange={(e) => updateState({ subject: e.target.value })}
                  placeholder="Email subject line..."
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Preview Text</label>
                <input type="text" value={state.previewText} onChange={(e) => updateState({ previewText: e.target.value })}
                  placeholder="Preview text shown in inbox..."
                  maxLength={150}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" />
                Email Preview
              </div>
              {state.editorDocument ? (
                <iframe
                  srcDoc={renderDocumentToHtml(state.editorDocument)}
                  className="w-full h-[400px]"
                  title="Content Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-sm text-slate-500">
                  Select a template first to preview content
                </div>
              )}
            </div>

            {validationResult && (
              <div className={`rounded-xl border p-4 ${validationResult.errors.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.errors.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="text-sm font-semibold text-white">Validation: {validationResult.status}</span>
                </div>
                {validationResult.errors.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-400">• {e.explanation}</p>
                    ))}
                  </div>
                )}
                {validationResult.warnings.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {validationResult.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-400">• {w.explanation}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">Campaign Content Mode</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Content is a snapshot from the template. Changes here won&apos;t affect the source template.
                  To edit block-level content in the visual editor, open the full template editor.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'audience' && (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Audience Selection</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Audience Source</label>
              <select value={state.audienceDefinition.type} onChange={(e) => updateState({ audienceDefinition: { ...state.audienceDefinition, type: e.target.value as AudienceDefinition['type'] } })}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
              >
                <option value="contact_list">All Contacts (leads with valid email)</option>
                <option value="manual_test">Manual Test Group</option>
                <option value="segment">Segment (coming soon)</option>
                <option value="saved_audience">Saved Audience (coming soon)</option>
                <option value="crm_filter">CRM Filter (coming soon)</option>
              </select>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Recipient Estimate</h3>
              {estimating ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </div>
              ) : audienceEstimate ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] rounded-xl p-3">
                      <p className="text-2xl font-bold text-white">{audienceEstimate.total}</p>
                      <p className="text-[11px] text-slate-500">Source Contacts</p>
                    </div>
                    <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-3">
                      <p className="text-2xl font-bold text-emerald-400">{audienceEstimate.eligible}</p>
                      <p className="text-[11px] text-emerald-400/70">Eligible Recipients</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Unsubscribed: {audienceEstimate.unsubscribed} | Invalid: {audienceEstimate.invalid}</p>
                    <p className="text-[10px] text-slate-600">Estimate excludes unsubscribed, do-not-contact, and invalid emails. Refreshed at send time.</p>
                  </div>
                  <button onClick={computeAudienceEstimate}
                    className="text-xs text-[#06B6D4] hover:underline cursor-pointer"
                  >
                    Refresh estimate
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Click refresh to calculate</p>
              )}
            </div>

            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">Suppression Safety</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Unsubscribed, do-not-contact, and invalid emails are always excluded. Campaign selections cannot override global suppressions.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'sender' && (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Sender & Tracking</h2>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Sender Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">From Name</label>
                  <input type="text" value={state.senderFromName} onChange={(e) => updateState({ senderFromName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">From Email</label>
                  <input type="email" value={state.senderFromEmail} onChange={(e) => updateState({ senderFromEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Reply-to Name</label>
                  <input type="text" value={state.senderReplyToName} onChange={(e) => updateState({ senderReplyToName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Reply-to Email</label>
                  <input type="email" value={state.senderReplyToEmail} onChange={(e) => updateState({ senderReplyToEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Tracking</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={state.trackingSettings.trackOpens}
                    onChange={(e) => updateState({ trackingSettings: { ...state.trackingSettings, trackOpens: e.target.checked } })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.1)] bg-white/[0.04] text-[#06B6D4] focus:ring-[#06B6D4]/20"
                  />
                  <span className="text-sm text-slate-300">Track opens</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={state.trackingSettings.trackClicks}
                    onChange={(e) => updateState({ trackingSettings: { ...state.trackingSettings, trackClicks: e.target.checked } })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.1)] bg-white/[0.04] text-[#06B6D4] focus:ring-[#06B6D4]/20"
                  />
                  <span className="text-sm text-slate-300">Track clicks</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">UTM Source</label>
                  <input type="text" value={state.trackingSettings.utmSource} onChange={(e) => updateState({ trackingSettings: { ...state.trackingSettings, utmSource: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">UTM Medium</label>
                  <input type="text" value={state.trackingSettings.utmMedium} onChange={(e) => updateState({ trackingSettings: { ...state.trackingSettings, utmMedium: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">UTM Campaign</label>
                  <input type="text" value={state.trackingSettings.utmCampaign} onChange={(e) => updateState({ trackingSettings: { ...state.trackingSettings, utmCampaign: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">UTM Content</label>
                  <input type="text" value={state.trackingSettings.utmContent} onChange={(e) => updateState({ trackingSettings: { ...state.trackingSettings, utmContent: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Review & Test</h2>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Campaign Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Name:</span> <span className="text-white ml-1">{state.name}</span></div>
                <div><span className="text-slate-500">Type:</span> <span className="text-white ml-1">{CAMPAIGN_TYPES.find(t => t.value === state.campaignType)?.label}</span></div>
                <div><span className="text-slate-500">Subject:</span> <span className="text-white ml-1">{state.subject || '—'}</span></div>
                <div><span className="text-slate-500">Sender:</span> <span className="text-white ml-1">{state.senderFromEmail}</span></div>
                <div><span className="text-slate-500">Template:</span> <span className="text-white ml-1">{templates.find(t => t.id === state.templateId)?.name || '—'}</span></div>
                <div><span className="text-slate-500">Est. Recipients:</span> <span className="text-white ml-1">{audienceEstimate?.eligible || '—'}</span></div>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Send Test</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewMode('desktop')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${previewMode === 'desktop' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
                  ><Monitor className="w-3 h-3 inline mr-1" />Desktop</button>
                  <button onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${previewMode === 'mobile' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
                  ><Smartphone className="w-3 h-3 inline mr-1" />Mobile</button>
                </div>
              </div>
              <div className={`bg-white rounded-xl overflow-hidden mx-auto ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[640px]'}`}>
                {state.editorDocument ? (
                  <iframe srcDoc={renderDocumentToHtml(state.editorDocument)} className="w-full h-[400px]" sandbox="allow-same-origin" />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">No content</div>
                )}
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Test Recipients</h3>
              {testRecipients.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="email" value={r} onChange={(e) => {
                    const next = [...testRecipients]; next[i] = e.target.value; setTestRecipients(next);
                  }} placeholder="test@example.com"
                    className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                  {testRecipients.length > 1 && (
                    <button onClick={() => setTestRecipients(testRecipients.filter((_, j) => j !== i))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"
                    ><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              {testRecipients.filter(r => r.trim()).length < 5 && (
                <button onClick={() => setTestRecipients([...testRecipients, ''])}
                  className="text-xs text-[#06B6D4] hover:underline cursor-pointer"
                >+ Add recipient</button>
              )}
              <button onClick={handleSendTest} disabled={testSending}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {testSending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'schedule' && (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Schedule or Send</h2>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <div className="flex gap-3">
                <button onClick={() => updateState({ scheduleType: 'now' })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    state.scheduleType === 'now' ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-4 h-4 inline mr-1.5" />
                  Send Now
                </button>
                <button onClick={() => updateState({ scheduleType: 'scheduled' })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    state.scheduleType === 'scheduled' ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1.5" />
                  Schedule
                </button>
              </div>

              {state.scheduleType === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input type="date" value={state.scheduledDate} onChange={(e) => updateState({ scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Time (Europe/London)</label>
                    <input type="time" value={state.scheduledTime} onChange={(e) => updateState({ scheduledTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">Final Confirmation Required</span>
              </div>
              <div className="text-xs text-amber-400/70 space-y-1">
                <p>Campaign: <strong>{state.name}</strong></p>
                <p>Subject: <strong>{state.subject || '—'}</strong></p>
                <p>From: <strong>{state.senderFromName} &lt;{state.senderFromEmail}&gt;</strong></p>
                <p>Estimated eligible: <strong>{audienceEstimate?.eligible || 0}</strong></p>
                <p className="text-amber-300">Send batch size: <strong>10 recipients per send</strong> (safety limit)</p>
                <p>Schedule: <strong>{state.scheduleType === 'now' ? 'Send immediately' : `${state.scheduledDate} at ${state.scheduledTime}`}</strong></p>
              </div>
              <button onClick={() => setSendConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-all cursor-pointer whitespace-nowrap mt-2"
              >
                <Send className="w-4 h-4" />
                {state.scheduleType === 'now' ? 'Confirm & Send Now' : 'Confirm & Schedule'}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {sendConfirmOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Confirm Send</h3>
                    <p className="text-xs text-slate-400">This will send to approximately {audienceEstimate?.eligible || 0} recipients</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3">Type the campaign name <strong className="text-white">{state.name}</strong> to confirm:</p>
                <input type="text" value={sendConfirmName} onChange={(e) => setSendConfirmName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setSendConfirmOpen(false); setSendConfirmName(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap"
                  >Cancel</button>
                  <button onClick={handleSendNow} disabled={sending || sendConfirmName.trim() !== state.name.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                    {sending ? 'Sending...' : 'Send Campaign'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] px-5 py-3 flex items-center justify-between">
        <button onClick={() => {
          const prevStep = STEPS[Math.max(0, stepIndex - 1)].key as WizardStep;
          goToStep(prevStep);
        }} disabled={stepIndex === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] text-slate-400 text-sm font-medium hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {stepIndex < STEPS.length - 1 && (
          <button onClick={() => {
            saveDraft();
            const nextStep = STEPS[stepIndex + 1].key as WizardStep;
            goToStep(nextStep);
          }} disabled={!canGoNext()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <AIDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        campaignId={campaign.id}
        brandKitId={state.brandKitId}
        editorDocument={state.editorDocument}
        selectedText={selectedText}
        subject={state.subject}
        previewText={state.previewText}
        onApplySubject={(s) => updateState({ subject: s })}
        onApplyPreviewText={(p) => updateState({ previewText: p })}
        onInsertText={() => {}}
      />
    </div>
  );
}
