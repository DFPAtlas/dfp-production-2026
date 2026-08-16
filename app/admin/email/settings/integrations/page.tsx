'use client';

import { useState } from 'react';
import {
  Link2, Server, Database, Workflow, Layers, FileText, Bell,
  Globe, BarChart3, Mail, ShieldCheck, ExternalLink, CheckCircle2,
  Clock, XCircle, AlertTriangle,
} from 'lucide-react';

interface Integration {
  key: string;
  name: string;
  purpose: string;
  status: 'connected' | 'disconnected' | 'not_configured' | 'error';
  configSource: string;
  owningModule: string;
  icon: React.ElementType;
}

const STATUS_BADGES: Record<string, string> = {
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  disconnected: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  not_configured: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  connected: CheckCircle2,
  disconnected: Clock,
  not_configured: Clock,
  error: XCircle,
};

export default function IntegrationsPage() {
  const [integrations] = useState<Integration[]>([
    {
      key: 'resend', name: 'Resend', purpose: 'Email sending and delivery provider',
      status: 'connected', configSource: 'Supabase Edge Function Secrets', owningModule: 'Providers', icon: Mail,
    },
    {
      key: 'supabase', name: 'Supabase', purpose: 'Database, Auth, Storage, Edge Functions',
      status: 'connected', configSource: 'Environment Variables (.env)', owningModule: 'Platform', icon: Database,
    },
    {
      key: 'n8n', name: 'n8n', purpose: 'Workflow automation and webhook orchestration',
      status: 'not_configured', configSource: 'n8n Webhook URLs', owningModule: 'Automations', icon: Workflow,
    },
    {
      key: 'storage', name: 'Supabase Storage', purpose: 'Email image and attachment storage',
      status: 'connected', configSource: 'Supabase Project Configuration', owningModule: 'Storage', icon: Layers,
    },
    {
      key: 'crm', name: 'CRM / Contacts', purpose: 'Contact and lead data source (leads table)',
      status: 'connected', configSource: 'Supabase Database', owningModule: 'Contacts', icon: Globe,
    },
    {
      key: 'notifications', name: 'Notifications', purpose: 'Alert delivery for operational events',
      status: 'connected', configSource: 'Supabase Database (notifications table)', owningModule: 'Notifications', icon: Bell,
    },
    {
      key: 'analytics_source', name: 'Analytics Source', purpose: 'Delivery and engagement event processing',
      status: 'connected', configSource: 'email_delivery_events + Resend Webhook', owningModule: 'Analytics', icon: BarChart3,
    },
    {
      key: 'dns_verification', name: 'DNS Verification', purpose: 'Sending domain DNS record checking',
      status: 'not_configured', configSource: 'Email Settings > Domains', owningModule: 'Domains', icon: ShieldCheck,
    },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Integrations</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Read-only inventory of all systems connected to Email Studio. Credentials are never displayed.
        </p>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-sm font-semibold text-white">Connected Systems</h2>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.03)]">
          {integrations.map((integration) => {
            const StatusIcon = STATUS_ICONS[integration.status] || Clock;
            return (
              <div key={integration.key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  integration.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                  integration.status === 'error' ? 'bg-red-500/10 text-red-400' :
                  'bg-white/[0.04] text-slate-500'
                }`}>
                  <integration.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${STATUS_BADGES[integration.status]}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {integration.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{integration.purpose}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[10px] text-slate-600">
                      Source: {integration.configSource}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      Module: {integration.owningModule}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Read-only
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Credential Security</h3>
            <p className="text-xs text-slate-500 mt-1">
              All provider keys, webhook secrets and service-role credentials are stored securely in Supabase Edge Function secrets or environment variables. They are never exposed to browser code or displayed in this inventory. Configuration sources indicate where each integration’s credentials are managed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
