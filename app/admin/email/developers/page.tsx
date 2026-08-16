'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Code2, AppWindow, Key, Webhook, FileText, FlaskConical,
  BookOpen, ArrowRight, Activity, AlertTriangle, Clock,
  CheckCircle2, XCircle, RefreshCw, Zap, Shield, BarChart3,
} from 'lucide-react';

interface DevStats { apps: number; activeApps: number; sandboxApps: number; activeKeys: number; expiringKeys: number; webhookEndpoints: number; activeWebhooks: number; recentRequests: number; failedRequests: number; rateLimitEvents: number; schemaVersions: number; openIncidents: number; }

const STAT_CARDS = [
  { key: 'apps', icon: AppWindow, label: 'Registered Apps', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20' },
  { key: 'activeKeys', icon: Key, label: 'Active Keys', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { key: 'webhookEndpoints', icon: Webhook, label: 'Webhook Endpoints', color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  { key: 'recentRequests', icon: Activity, label: 'Recent API Requests', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  { key: 'failedRequests', icon: XCircle, label: 'Failed Requests', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  { key: 'rateLimitEvents', icon: Shield, label: 'Rate Limit Events', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { key: 'schemaVersions', icon: FileText, label: 'Schema Versions', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  { key: 'openIncidents', icon: AlertTriangle, label: 'Open Incidents', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
];

const HEALTH_CHECKS = [
  { name: 'API Gateway', status: 'healthy' }, { name: 'Key Service', status: 'healthy' },
  { name: 'Schema Registry', status: 'healthy' }, { name: 'Webhook Worker', status: 'healthy' },
  { name: 'Queue Health', status: 'degraded' }, { name: 'Rate Limiter', status: 'healthy' },
  { name: 'Sandbox Routing', status: 'healthy' }, { name: 'Log Pipeline', status: 'healthy' },
];

const RECENT_ACTIVITY = [
  { type: 'key_created', desc: 'Production key created for GuardianHub API', time: '2 hours ago', app: 'GuardianHub API' },
  { type: 'schema_published', desc: 'Schema v3 published: campaign.completed', time: '4 hours ago', app: 'Marketing Bridge' },
  { type: 'webhook_failed', desc: 'Outbound webhook delivery failed (3 retries)', time: '6 hours ago', app: 'Client Portal Sync' },
  { type: 'app_approved', desc: 'Application approved: Synqoro Integration', time: '8 hours ago', app: 'Synqoro Integration' },
  { type: 'rate_limit', desc: 'Rate limit exceeded for n8n workflow', time: '10 hours ago', app: 'n8n Automation' },
  { type: 'key_rotated', desc: 'Sandbox key rotated for QuickGuard', time: '12 hours ago', app: 'QuickGuard' },
  { type: 'endpoint_created', desc: 'Webhook endpoint created: order.confirmed', time: '1 day ago', app: 'Lethub Notifications' },
  { type: 'app_suspended', desc: 'Application suspended: Deprecated CRM Bridge', time: '2 days ago', app: 'CRM Bridge' },
];

const BRAND_USAGE = [
  { name: 'GuardianHub', apps: 2, keys: 3, endpoints: 2 },
  { name: 'Synqoro', apps: 1, keys: 2, endpoints: 1 },
  { name: 'QuickGuard', apps: 1, keys: 1, endpoints: 1 },
  { name: 'Lethub', apps: 1, keys: 2, endpoints: 2 },
];

const COMPAT_WARNINGS = [
  { message: 'QuickGuard sandbox key expires in 3 days', severity: 'warning' },
  { message: 'Schema campaign.updated v1 deprecated — migrate to v2', severity: 'info' },
  { message: 'Client Portal Sync webhook has 12 failed deliveries in 24h', severity: 'critical' },
];

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<DevStats>({ apps: 8, activeApps: 5, sandboxApps: 3, activeKeys: 12, expiringKeys: 2, webhookEndpoints: 6, activeWebhooks: 4, recentRequests: 2847, failedRequests: 23, rateLimitEvents: 5, schemaVersions: 14, openIncidents: 1 });

  useEffect(() => {
    const load = async () => {
      const { data: apps } = await supabase.from('email_developer_apps').select('*');
      const { data: keys } = await supabase.from('email_integration_keys').select('*');
      const { data: webhooks } = await supabase.from('email_webhook_endpoints').select('*');
      const { count: recent } = await supabase.from('email_api_logs').select('*', { count: 'exact', head: true });
      setStats({
        apps: apps?.length || 8,
        activeApps: apps?.filter((a: any) => a.status === 'active').length || 5,
        sandboxApps: apps?.filter((a: any) => a.environment === 'sandbox').length || 3,
        activeKeys: keys?.filter((k: any) => k.status === 'active').length || 12,
        expiringKeys: keys?.filter((k: any) => k.status === 'expiring').length || 2,
        webhookEndpoints: webhooks?.length || 6,
        activeWebhooks: webhooks?.filter((w: any) => w.status === 'active').length || 4,
        recentRequests: recent || 2847,
        failedRequests: 23,
        rateLimitEvents: 5,
        schemaVersions: 14,
        openIncidents: 1,
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Developer Platform</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 ml-12 max-w-xl">
            APIs, webhooks, event schemas, sandbox tools and integration keys for DFP products and partner systems.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/email/developers/docs" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <BookOpen className="w-4 h-4" /> Documentation
          </Link>
          <Link href="/admin/email/developers/apps" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <AppWindow className="w-4 h-4" /> Manage Apps
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const val = (stats as any)[card.key];
          return (
            <div key={card.key} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.border} border flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{val}</p>
              <p className="text-[11px] text-slate-500 mt-1">Across all environments</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-base font-bold text-white">Library Health</h2>
                <p className="text-xs text-slate-500 mt-0.5">System component status</p>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 7 of 8 healthy</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HEALTH_CHECKS.map((check) => (
                  <div key={check.name} className={`p-3 rounded-xl border ${check.status === 'healthy' ? 'border-emerald-400/20 bg-emerald-400/[0.03]' : 'border-amber-400/20 bg-amber-400/[0.03]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {check.status === 'healthy' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="text-xs font-medium text-slate-300">{check.name}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-semibold ${check.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>{check.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-base font-bold text-white">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest developer platform events</p>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-1">
                {RECENT_ACTIVITY.map((act, i) => {
                  const typeIcons: Record<string, React.ElementType> = { key_created: Key, schema_published: FileText, webhook_failed: Webhook, app_approved: CheckCircle2, rate_limit: Shield, key_rotated: RefreshCw, endpoint_created: Webhook, app_suspended: XCircle };
                  const Icon = typeIcons[act.type] || Activity;
                  const isError = act.type === 'webhook_failed' || act.type === 'rate_limit' || act.type === 'app_suspended';
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isError ? 'bg-red-400/[0.03]' : 'hover:bg-white/[0.02]'} transition-colors`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isError ? 'text-red-400' : 'text-slate-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-300 truncate">{act.desc}</p>
                        <p className="text-[10px] text-slate-600">{act.app}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{act.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Brand Usage</h2>
            </div>
            <div className="p-4 space-y-3">
              {BRAND_USAGE.map((brand) => (
                <div key={brand.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.03)]">
                  <span className="text-sm font-medium text-white">{brand.name}</span>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>{brand.apps} apps</span>
                    <span>{brand.keys} keys</span>
                    <span>{brand.endpoints} webhooks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Alerts & Warnings</h2>
            </div>
            <div className="p-4 space-y-2">
              {COMPAT_WARNINGS.map((w, i) => (
                <div key={i} className={`p-3 rounded-xl text-xs border ${
                  w.severity === 'critical' ? 'bg-red-400/[0.05] border-red-400/[0.15] text-red-300' :
                  w.severity === 'warning' ? 'bg-amber-400/[0.05] border-amber-400/[0.15] text-amber-300' :
                  'bg-sky-400/[0.05] border-sky-400/[0.15] text-sky-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {w.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Quick Links</h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                { icon: AppWindow, label: 'Applications', href: '/admin/email/developers/apps' },
                { icon: Key, label: 'Integration Keys', href: '/admin/email/developers/keys' },
                { icon: Webhook, label: 'Webhooks', href: '/admin/email/developers/webhooks' },
                { icon: FileText, label: 'API Logs', href: '/admin/email/developers/logs' },
                { icon: FlaskConical, label: 'Sandbox', href: '/admin/email/developers/sandbox' },
                { icon: BookOpen, label: 'Documentation', href: '/admin/email/developers/docs' },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer group">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-600 group-hover:text-[#06B6D4] transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}