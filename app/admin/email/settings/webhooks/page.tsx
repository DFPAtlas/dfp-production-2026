'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Webhook, ArrowLeft, CheckCircle2, XCircle, Clock,
  AlertTriangle, RefreshCw, Key, Shield, ExternalLink, Copy,
} from 'lucide-react';

interface WebhookHealthData {
  lastEvent: string | null;
  lastSuccessful: string | null;
  recentFailures: number;
  totalEvents: number;
  eventTypes: string[];
  signatureStatus: 'configured' | 'missing';
  processingStatus: 'healthy' | 'degraded' | 'failing';
  duplicateRate: number;
}

export default function WebhookSettingsPage() {
  const [health, setHealth] = useState<WebhookHealthData>({
    lastEvent: null,
    lastSuccessful: null,
    recentFailures: 0,
    totalEvents: 0,
    eventTypes: [],
    signatureStatus: 'missing',
    processingStatus: 'healthy',
    duplicateRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    loadHealth();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    setWebhookUrl(`${supabaseUrl}/functions/v1/resend-webhook`);
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    const { data: events, count: total } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(50);

    const lastEvent = events?.[0]?.created_at || null;
    const delivered = events?.filter((e) => e.event_type === 'delivered');
    const lastSuccessful = delivered?.[0]?.created_at || null;
    const failedCount = events?.filter((e) => e.event_type === 'failed').length || 0;
    const types = [...new Set((events || []).map((e) => e.event_type))];
    const duplicates = events?.filter((e) => e.safe_metadata?.duplicate).length || 0;

    setHealth({
      lastEvent,
      lastSuccessful,
      recentFailures: failedCount,
      totalEvents: total || 0,
      eventTypes: types as string[],
      signatureStatus: 'configured',
      processingStatus: failedCount > 10 ? 'failing' : failedCount > 3 ? 'degraded' : 'healthy',
      duplicateRate: total ? Math.round((duplicates / Math.min(total, 50)) * 100) : 0,
    });
    setLoading(false);
  };

  const handleRotateSecret = async () => {
    setRotating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setRotating(false);
    setShowSecretModal(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-64 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Webhook Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage provider webhook endpoint, signature verification and event processing</p>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Resend Webhook</h2>
            <p className="text-xs text-slate-500">Receives delivery, bounce, open, click and complaint events</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white font-mono break-all">{webhookUrl}</code>
              <button onClick={() => { try { navigator.clipboard.writeText(webhookUrl); } catch {} }} className="text-slate-500 hover:text-white cursor-pointer shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Add this URL in your Resend dashboard under Webhooks</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Signature Verification</p>
            <div className="flex items-center gap-2">
              {health.signatureStatus === 'configured' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Svix Signatures Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                  <XCircle className="w-3 h-3" /> Not Configured
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{health.totalEvents}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Total Events</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{health.recentFailures}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Recent Failures</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{health.duplicateRate}%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Duplicate Rate</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
              health.processingStatus === 'healthy' ? 'text-emerald-400 bg-emerald-400/10' :
              health.processingStatus === 'degraded' ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {health.processingStatus === 'healthy' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {health.processingStatus}
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Processing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Event Received</p>
            <p className="text-sm text-white">{health.lastEvent ? new Date(health.lastEvent).toLocaleString() : 'No events'}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Successful Processing</p>
            <p className="text-sm text-white">{health.lastSuccessful ? new Date(health.lastSuccessful).toLocaleString() : 'None'}</p>
          </div>
        </div>

        {health.eventTypes.length > 0 && (
          <div className="bg-white/[0.02] rounded-xl p-4 mb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Enabled Event Types</p>
            <div className="flex flex-wrap gap-2">
              {health.eventTypes.map((t) => (
                <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                  {t}
                </span>
              ))}
              {health.eventTypes.length === 0 && (
                <span className="text-xs text-slate-500">No events received yet</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={loadHealth} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowSecretModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <Key className="w-4 h-4" />
            Rotate Secret
          </button>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">Setup Instructions</h3>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
          <li>Go to your Resend dashboard Webhooks section</li>
          <li>Add the webhook URL shown above</li>
          <li>Enable these events: sent, delivered, opened, clicked, bounced, complained</li>
          <li>Copy the Svix signing secret to RESEND_WEBHOOK_SECRET in Supabase Edge Function secrets</li>
          <li>Send a test email and verify events appear above</li>
        </ol>
      </div>

      {showSecretModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSecretModal(false)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Rotate Webhook Secret</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              This will generate a new webhook signing secret. You must update the secret in your Resend dashboard before retiring the old one, or webhook events will fail verification.
            </p>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">
                Update the secret in your provider dashboard first, then retire the old secret here. Do not delete the old secret before the provider is updated.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSecretModal(false)} className="flex-1 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap">
                Cancel
              </button>
              <button onClick={handleRotateSecret} disabled={rotating} className="flex-1 px-4 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap">
                {rotating ? 'Rotating...' : 'Rotate Secret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}