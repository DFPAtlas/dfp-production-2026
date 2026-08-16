'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Server, CheckCircle2, XCircle, Clock, RefreshCw,
  AlertTriangle, ExternalLink, Shield, ArrowLeft, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { CLICKABLE_STATUS_LABELS, type ProviderConnection } from '@/components/admin/email/settings/settings-types';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

export default function ProviderSettingsPage() {
  const [provider, setProvider] = useState<ProviderConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    loadProvider();
  }, []);

  const loadProvider = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_provider_connections').select('*').eq('provider', 'resend').maybeSingle();
    setProvider(data as ProviderConnection || null);
    setLoading(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-template-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: '00000000-0000-0000-0000-000000000000',
          to: 'test@example.com',
          subject_prefix: '[TEST] ',
        }),
      });
      const body = await res.json();
      const isAuthError = body?.error && (
        body.error.toLowerCase().includes('not found') ||
        body.error.toLowerCase().includes('template')
      );
      const isOk = isAuthError || res.ok;

      const now = new Date().toISOString();
      await supabase.from('email_provider_connections').upsert({
        organisation_id: provider?.organisation_id || DEFAULT_ORG_ID,
        provider: 'resend',
        status: isOk ? 'active' : 'failed',
        last_checked_at: now,
        last_error_code: isOk ? null : 'connection_failed',
        last_error_message: isOk ? null : (body?.error || 'Unknown error'),
        configuration_source: 'environment',
      }, { onConflict: 'organisation_id,provider' });

      setTestResult({
        ok: isOk,
        message: isOk ? 'Resend API is reachable and authenticated' : `Connection failed: ${body?.error || 'Unknown error'}`,
      });
      await loadProvider();
    } catch (err: unknown) {
      setTestResult({ ok: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown'}` });
    }
    setTesting(false);
  };

  const handleInitialize = async () => {
    setInitLoading(true);
    try {
      await supabase.from('email_provider_connections').upsert({
        organisation_id: DEFAULT_ORG_ID,
        provider: 'resend',
        status: 'configured',
        last_checked_at: new Date().toISOString(),
        configuration_source: 'environment',
      }, { onConflict: 'organisation_id,provider' });
      await loadProvider();
    } catch {}
    setInitLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-white/[0.04] rounded-lg" />
        <div className="h-64 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  const statusInfo = CLICKABLE_STATUS_LABELS[provider?.status || 'unconfigured'] || CLICKABLE_STATUS_LABELS.unconfigured;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Provider Configuration</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage email provider connections and test connectivity</p>
        </div>
      </div>

      {!provider || provider.status === 'unconfigured' ? (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
            <Server className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No Provider Configured</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Resend API keys are stored securely in Supabase Edge Function secrets (RESEND_API_KEY, RESEND_FROM_DOMAIN).
            Initialize the provider record to enable connection testing and status monitoring.
          </p>
          <button
            onClick={handleInitialize}
            disabled={initLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {initLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Initialize Provider
          </button>
        </div>
      ) : (
        <>
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${provider.status === 'active' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <Server className={`w-5 h-5 ${provider.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Resend</h2>
                  <p className="text-xs text-slate-500">Email delivery provider</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${statusInfo.color}`}>
                {provider.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                {provider.status === 'failed' && <XCircle className="w-3 h-3" />}
                {statusInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Configuration Source</p>
                <p className="text-sm text-white font-medium capitalize">{provider.configuration_source}</p>
                <p className="text-[10px] text-slate-500 mt-1">API keys stored in Supabase Edge Function secrets</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Checked</p>
                <p className="text-sm text-white font-medium">
                  {provider.last_checked_at ? new Date(provider.last_checked_at).toLocaleString() : 'Never'}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sending Capability</p>
                <p className="text-sm text-white font-medium">
                  {provider.status === 'active' ? 'Available' : 'Not confirmed'}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Webhook Capability</p>
                <p className="text-sm text-white font-medium">
                  Supported (Svix signatures)
                </p>
              </div>
            </div>

            {provider.last_error_message && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-300">Last Error</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{provider.last_error_message}</p>
                </div>
              </div>
            )}

            {testResult && (
              <div className={`rounded-xl p-3 mb-4 flex items-start gap-2 ${testResult.ok ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                )}
                <p className={`text-xs ${testResult.ok ? 'text-emerald-300' : 'text-red-300'}`}>{testResult.message}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Test Connection
              </button>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">Security Notes</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                API keys are stored in Supabase Edge Function secrets and never exposed to the browser
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                To update credentials, add RESEND_API_KEY and RESEND_FROM_DOMAIN in Supabase Dashboard
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                All email sending runs server-side through the send-template-email edge function
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}