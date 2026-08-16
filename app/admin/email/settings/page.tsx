'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Server, UserCheck, MousePointerClick, Webhook, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, Clock, ArrowRight,
  RefreshCw, ExternalLink, Plus, Settings,
  FileText, Activity, Archive, Link2, Lock, Users,
  Sparkles, GlobeIcon, BeakerIcon, UserCog, Monitor, Shield, Package, ClipboardCheck, PencilRuler, Code2,
} from 'lucide-react';
import { CLICKABLE_STATUS_LABELS } from '@/components/admin/email/settings/settings-types';

interface StatusSummary {
  provider: string;
  providerStatus: string;
  providerChecked: string | null;
  domainCount: number;
  verifiedDomainCount: number;
  senderCount: number;
  verifiedSenderCount: number;
  webhookLastEvent: string | null;
  webhookRecentFailures: number;
  webhookHealthy: boolean;
  deliveryRate: number | null;
  outstandingIssues: string[];
}

function StatusBadge({ status }: { status: string }) {
  const info = CLICKABLE_STATUS_LABELS[status] || { label: status, color: 'text-slate-400 bg-slate-400/10' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${info.color}`}>
      {info.label}
    </span>
  );
}

function StatusCard({ icon: Icon, title, status, detail, actionLabel, actionHref, warning, badgeStatus }: {
  icon: React.ElementType;
  title: string;
  status: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  warning?: boolean;
  badgeStatus?: string;
}) {
  return (
    <div className={`bg-[#121215] border rounded-2xl p-5 ${warning ? 'border-red-500/20' : 'border-[rgba(255,255,255,0.06)]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${warning ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.04] text-slate-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {badgeStatus && <div className="mt-1"><StatusBadge status={badgeStatus} /></div>}
            {!badgeStatus && (
              <p className="text-xs text-slate-500 mt-0.5">{status}</p>
            )}
          </div>
        </div>
        {warning && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
        {!warning && status.toLowerCase().includes('verified') && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      </div>
      <p className="text-xs text-slate-400 mb-4">{detail}</p>
      <Link href={actionHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
        {actionLabel} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function EmailSettingsOverview() {
  const [summary, setSummary] = useState<StatusSummary>({
    provider: 'resend',
    providerStatus: 'checking',
    providerChecked: null,
    domainCount: 0,
    verifiedDomainCount: 0,
    senderCount: 0,
    verifiedSenderCount: 0,
    webhookLastEvent: null,
    webhookRecentFailures: 0,
    webhookHealthy: false,
    deliveryRate: null,
    outstandingIssues: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    const issues: string[] = [];

    const { data: provider } = await supabase.from('email_provider_connections').select('*').eq('provider', 'resend').maybeSingle();
    const { count: domainCount } = await supabase.from('email_sending_domains').select('*', { count: 'exact', head: true });
    const { count: verifiedDomainCount } = await supabase.from('email_sending_domains').select('*', { count: 'exact', head: true }).eq('status', 'verified');
    const { count: senderCount } = await supabase.from('email_sender_profiles').select('*', { count: 'exact', head: true });
    const { count: verifiedSenderCount } = await supabase.from('email_sender_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified');
    const { data: lastEvent } = await supabase.from('email_delivery_events').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { count: recentFailures } = await supabase.from('email_delivery_events').select('*', { count: 'exact', head: true }).eq('event_type', 'failed');

    const providerStatus = provider?.status || 'unconfigured';
    if (providerStatus === 'unconfigured') issues.push('Resend provider not configured');
    if ((domainCount || 0) === 0) issues.push('No sending domains configured');
    if ((verifiedDomainCount || 0) === 0 && (domainCount || 0) > 0) issues.push('No verified sending domains');
    if ((senderCount || 0) === 0) issues.push('No sender profiles created');
    if ((verifiedSenderCount || 0) === 0 && (senderCount || 0) > 0) issues.push('No verified sender profiles');

    setSummary({
      provider: 'resend',
      providerStatus,
      providerChecked: provider?.last_checked_at || null,
      domainCount: domainCount || 0,
      verifiedDomainCount: verifiedDomainCount || 0,
      senderCount: senderCount || 0,
      verifiedSenderCount: verifiedSenderCount || 0,
      webhookLastEvent: lastEvent?.created_at || null,
      webhookRecentFailures: recentFailures || 0,
      webhookHealthy: (recentFailures || 0) === 0 && !!lastEvent,
      deliveryRate: null,
      outstandingIssues: issues,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-[#121215] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const providerDisplay = summary.provider.charAt(0).toUpperCase() + summary.provider.slice(1);
  const providerStatusInfo = CLICKABLE_STATUS_LABELS[summary.providerStatus] || { label: summary.providerStatus, color: '' };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Email Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Manage providers, domains, senders, permissions, compliance, audit, retention and operational health.
        </p>
      </div>

      {summary.outstandingIssues.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-300 mb-2">Configuration Issues ({summary.outstandingIssues.length})</h3>
              <ul className="space-y-1">
                {summary.outstandingIssues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-400/80 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatusCard
          icon={Server}
          title="Email Provider"
          status={`${providerDisplay} — ${providerStatusInfo.label}`}
          detail={summary.providerChecked ? `Last checked: ${new Date(summary.providerChecked).toLocaleDateString()}` : 'Provider connection status'}
          actionLabel="Manage Provider"
          actionHref="/admin/email/settings/providers"
          badgeStatus={summary.providerStatus}
          warning={summary.providerStatus === 'unconfigured' || summary.providerStatus === 'failed'}
        />

        <StatusCard
          icon={GlobeIcon}
          title="Sending Domains"
          status={`${summary.verifiedDomainCount} of ${summary.domainCount} verified`}
          detail={summary.domainCount === 0 ? 'Add a domain to start sending email' : `${summary.verifiedDomainCount} domain${summary.verifiedDomainCount !== 1 ? 's' : ''} ready for sending`}
          actionLabel="Manage Domains"
          actionHref="/admin/email/settings/domains"
          warning={summary.domainCount === 0 || summary.verifiedDomainCount === 0}
        />

        <StatusCard
          icon={UserCheck}
          title="Sender Profiles"
          status={`${summary.verifiedSenderCount} of ${summary.senderCount} verified`}
          detail={summary.senderCount === 0 ? 'Create a sender profile to define From addresses' : `${summary.verifiedSenderCount} profile${summary.verifiedSenderCount !== 1 ? 's' : ''} verified`}
          actionLabel="Manage Senders"
          actionHref="/admin/email/settings/senders"
          warning={summary.senderCount === 0 || summary.verifiedSenderCount === 0}
        />

        <StatusCard
          icon={MousePointerClick}
          title="Tracking Domain"
          status="Not configured"
          detail="Custom tracking domain improves deliverability and keeps links on-brand"
          actionLabel="Configure Tracking"
          actionHref="/admin/email/settings/tracking"
        />

        <StatusCard
          icon={Webhook}
          title="Webhook Health"
          status={summary.webhookHealthy ? 'Receiving events' : summary.webhookLastEvent ? 'Issues detected' : 'No events received'}
          detail={summary.webhookLastEvent ? `Last event: ${new Date(summary.webhookLastEvent).toLocaleDateString()}` : 'Set up webhooks for delivery tracking'}
          actionLabel="View Webhooks"
          actionHref="/admin/email/settings/webhooks"
          warning={!summary.webhookHealthy}
        />

        <StatusCard
          icon={ShieldCheck}
          title="Deliverability"
          status={summary.deliveryRate !== null ? `${summary.deliveryRate}% delivery rate` : 'Configure safeguards'}
          detail="Bounce thresholds, rate limits, suppression rules and alert settings"
          actionLabel="Deliverability Settings"
          actionHref="/admin/email/settings/deliverability"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/admin/email/settings/providers" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Server className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Provider Configuration</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/domains" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <GlobeIcon className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Sending Domains</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/senders" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Sender Profiles</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/tracking" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <MousePointerClick className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Tracking Domain</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/webhooks" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Webhook className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Webhooks</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/deliverability" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Deliverability</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-[#06B6D4]" />
          <h2 className="text-sm font-semibold text-white">Workspace & Administration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCard
            icon={Settings}
            title="General Settings"
            status="Configure workspace defaults"
            detail="Workspace name, timezone, date format, defaults, approval requirements and sending safeguards"
            actionLabel="General Settings"
            actionHref="/admin/email/settings/general"
          />

          <StatusCard
            icon={Users}
            title="Roles & Permissions"
            status="Manage capabilities per role"
            detail="48 Email Studio capabilities across 7 modules — templates, campaigns, automations, contacts, analytics, suppressions, administration"
            actionLabel="Manage Permissions"
            actionHref="/admin/email/settings/permissions"
          />

          <StatusCard
            icon={ShieldCheck}
            title="Compliance & Consent"
            status="Review compliance settings"
            detail="Privacy links, consent model, tracking policy, complaint handling, sending safeguards and legal footer"
            actionLabel="Compliance Settings"
            actionHref="/admin/email/settings/compliance"
          />

          <StatusCard
            icon={FileText}
            title="Audit History"
            status="Append-only audit trail"
            detail="Track all Email Studio actions — create, update, approve, send, import, export and configure — with filters and CSV export"
            actionLabel="View Audit Log"
            actionHref="/admin/email/settings/audit"
          />

          <StatusCard
            icon={Archive}
            title="Data Retention"
            status="Configure retention periods"
            detail="Retention rules for delivery events, recipient tracking, imports, exports, audit logs, suppression evidence and consent records"
            actionLabel="Retention Settings"
            actionHref="/admin/email/settings/retention"
          />

          <StatusCard
            icon={Activity}
            title="Operational Health"
            status="12 system checks"
            detail="Real-time status of database, provider, domains, webhooks, templates, suppressions, storage, analytics, RLS and indexes"
            actionLabel="View Health"
            actionHref="/admin/email/settings/health"
          />

          <StatusCard
            icon={Sparkles}
            title="AI Assistant"
            status="Configure AI writing tools"
            detail="Enable and configure the AI-powered writing assistant — provider, model, usage limits, allowed capabilities and privacy controls"
            actionLabel="AI Settings"
            actionHref="/admin/email/settings/ai"
          />

          <StatusCard
            icon={GlobeIcon}
            title="Languages & Localisation"
            status="Configure multilingual support"
            detail="Source language, enabled languages, fallbacks, reviewer roles, brand language availability and localised legal content requirements"
            actionLabel="Language Settings"
            actionHref="/admin/email/settings/languages"
          />

          <StatusCard
            icon={BeakerIcon}
            title="Experiment Settings"
            status="Configure A/B testing defaults"
            detail="Variant limits, statistical methods, decision thresholds, guardrails, automatic winner policy and approved experiment types"
            actionLabel="Experiment Settings"
            actionHref="/admin/email/settings/experiments"
          />

          <StatusCard
            icon={UserCog}
            title="Personalisation"
            status="Manage fields and rules"
            detail="Approved field catalogue, fallback policies, sensitivity controls, dynamic content rules, test previews and rendering safety"
            actionLabel="Personalisation Settings"
            actionHref="/admin/email/settings/personalisation"
          />

          <StatusCard
            icon={Monitor}
            title="Rendering & Regression"
            status="Configure render testing"
            detail="Client matrix, visual-regression thresholds, test presets, release gates, usage controls and provider configuration"
            actionLabel="Rendering Settings"
            actionHref="/admin/email/settings/rendering"
          />

          <StatusCard
            icon={Shield}
            title="Sender Reputation"
            status="Configure reputation monitoring"
            detail="Deliverability thresholds, warm-up defaults, blocklist services, anomaly detection, incident policies and usage controls"
            actionLabel="Reputation Settings"
            actionHref="/admin/email/settings/reputation"
          />

          <StatusCard
            icon={Package}
            title="Backup & Portability"
            status="Configure backup and export settings"
            detail="Scheduled backups, retention policies, storage quotas, restore-test cadence, export permissions and usage controls"
            actionLabel="Backup Settings"
            actionHref="/admin/email/settings/backup"
          />

          <StatusCard
            icon={ClipboardCheck}
            title="External Reviews"
            status="Configure review & approval"
            detail="Secure preview links, token security, reviewer access controls, approval policies, notifications, watermarking and evidence downloads"
            actionLabel="Review Settings"
            actionHref="/admin/email/settings/external-reviews"
          />

          <StatusCard
            icon={PencilRuler}
            title="Design System"
            status="Configure governance & publishing"
            detail="Publishing requirements, update policies, inheritance chain, rendering evidence requirements and notification preferences"
            actionLabel="Design System Settings"
            actionHref="/admin/email/settings/design-system"
          />

          <StatusCard
            icon={Link2}
            title="Integrations"
            status="Read-only inventory"
            detail="Connected systems: Resend, Supabase, Storage, CRM/Contacts, Notifications, Analytics, DNS Verification — credentials never displayed"
            actionLabel="View Integrations"
            actionHref="/admin/email/settings/integrations"
          />

          <StatusCard
            icon={Code2}
            title="API & Developer Platform"
            status="Configure API gateway and security"
            detail="Rate limits, key policies, webhook defaults, sandbox controls, emergency actions and security notifications"
            actionLabel="API Settings"
            actionHref="/admin/email/settings/api"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/email/settings/general" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">General</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/permissions" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Users className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Permissions</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/compliance" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Compliance</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/audit" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <FileText className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Audit Log</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/retention" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Archive className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Retention</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/health" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Activity className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Health</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/ai" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/languages" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <GlobeIcon className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Languages</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/experiments" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <BeakerIcon className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Experiments</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/personalisation" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <UserCog className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Personalisation</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/rendering" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Monitor className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Rendering</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/reputation" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Shield className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Reputation</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/external-reviews" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <ClipboardCheck className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">External Reviews</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/design-system" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <PencilRuler className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Design System</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/integrations" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Link2 className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Integrations</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/api" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Code2 className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">API & Developer</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/backup" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <Package className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Backup</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
      </div>
    </div>
  );
}