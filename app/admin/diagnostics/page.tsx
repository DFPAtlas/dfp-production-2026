'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from '@/components/motion';
import { supabase, getSessionSafe } from '@/lib/supabase';
import { LoadingState, ErrorState, NoRecordsState } from '@/components/admin/shared/DataState';
import AdminShell from '@/components/admin/AdminShell';
import type { DiagnosticsResult, ConnectionStatus } from '@/lib/supabase.types';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Wifi, Shield,
  Database, HardDrive, Radio, RefreshCw, Clock, Server,
  ChevronRight,
} from 'lucide-react';

const emptyDiagnostics: DiagnosticsResult = {
  supabaseUrl: '',
  connection: 'Unknown',
  connectionError: null,
  authAvailable: 'Unknown',
  authError: null,
  profileLinked: 'Unknown',
  profile: null,
  profileError: null,
  dbQuery: 'Unknown',
  dbQueryResult: null,
  dbQueryError: null,
  storageReady: 'Unknown',
  storageError: null,
  realtimeReady: 'Unknown',
  realtimeError: null,
  environment: '',
  lastTestTime: '',
};

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
    'Connected': { color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Connected' },
    'Partially Connected': { color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-4 h-4" />, label: 'Partial' },
    'Configuration Required': { color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <AlertTriangle className="w-4 h-4" />, label: 'Setup Needed' },
    'Failed': { color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <XCircle className="w-4 h-4" />, label: 'Failed' },
    'Unknown': { color: '#6B7280', bg: 'bg-white/5', border: 'border-[rgba(255,255,255,0.08)]', icon: <AlertTriangle className="w-4 h-4" />, label: 'Unknown' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg} ${c.border}`} style={{ color: c.color }}>
      {c.icon}
      {c.label}
    </span>
  );
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult>(emptyDiagnostics);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const runDiagnostics = useCallback(async () => {
    setLoading(true);
    const result: DiagnosticsResult = { ...emptyDiagnostics };
    result.environment = process.env.NODE_ENV || 'unknown';
    result.lastTestTime = new Date().toISOString();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    result.supabaseUrl = supabaseUrl ? supabaseUrl.replace(/\/$/, '') : '';

    // 1. Connection test
    if (!supabaseUrl || !supabaseKey) {
      result.connection = 'Configuration Required';
      result.connectionError = 'Missing Supabase environment variables';
    } else {
      try {
        const { error } = await supabase.from('admin_profiles').select('id', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
          result.connection = 'Failed';
          result.connectionError = error.message;
        } else {
          result.connection = 'Connected';
        }
      } catch (err) {
        result.connection = 'Failed';
        result.connectionError = err instanceof Error ? err.message : 'Connection test threw an exception';
      }
    }

    // 2. Auth check
    try {
      const session = await getSessionSafe();
      if (session) {
        result.authAvailable = 'Connected';
      } else {
        result.authAvailable = 'Partially Connected';
        result.authError = 'No active session found';
      }
    } catch (err) {
      result.authAvailable = 'Failed';
      result.authError = err instanceof Error ? err.message : 'Auth check failed';
    }

    // 3. Profile linkage
    try {
      const session = await getSessionSafe();
      if (!session) {
        result.profileLinked = 'Partially Connected';
        result.profileError = 'Cannot check profile without session';
      } else {
        const { data: profile, error } = await supabase
          .from('admin_profiles')
          .select('email, role, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          result.profileLinked = 'Failed';
          result.profileError = error.message;
        } else if (!profile) {
          result.profileLinked = 'Failed';
          result.profileError = 'No admin profile linked to this account';
        } else {
          result.profileLinked = 'Connected';
          result.profile = {
            email: profile.email,
            role: profile.role,
            fullName: profile.full_name,
          };
        }
      }
    } catch (err) {
      result.profileLinked = 'Failed';
      result.profileError = err instanceof Error ? err.message : 'Profile check failed';
    }

    // 4. Database query test
    try {
      const [clientsRes, leadsRes, projectsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
      ]);

      const errors = [clientsRes.error, leadsRes.error, projectsRes.error].filter(Boolean);
      if (errors.length > 0) {
        result.dbQuery = 'Failed';
        result.dbQueryError = errors.map((e) => e!.message).join('; ');
      } else {
        result.dbQuery = 'Connected';
        result.dbQueryResult = {
          clients: clientsRes.count || 0,
          leads: leadsRes.count || 0,
          projects: projectsRes.count || 0,
        };
      }
    } catch (err) {
      result.dbQuery = 'Failed';
      result.dbQueryError = err instanceof Error ? err.message : 'DB query test failed';
    }

    // 5. Storage check
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        result.storageReady = 'Failed';
        result.storageError = error.message;
      } else if (!buckets || buckets.length === 0) {
        result.storageReady = 'Partially Connected';
        result.storageError = 'No storage buckets configured';
      } else {
        result.storageReady = 'Connected';
      }
    } catch (err) {
      result.storageReady = 'Failed';
      result.storageError = err instanceof Error ? err.message : 'Storage check failed';
    }

    // 6. Realtime check
    try {
      const channel = supabase.channel('diagnostics-test');
      const status = await new Promise<'ok' | 'error'>((resolve) => {
        const timeout = setTimeout(() => resolve('error'), 3000);
        channel.subscribe((status) => {
          clearTimeout(timeout);
          if (status === 'SUBSCRIBED') {
            resolve('ok');
          } else {
            resolve('error');
          }
        });
      });

      await supabase.removeChannel(channel);

      if (status === 'ok') {
        result.realtimeReady = 'Connected';
      } else {
        result.realtimeReady = 'Failed';
        result.realtimeError = 'Realtime subscription timed out';
      }
    } catch (err) {
      result.realtimeReady = 'Failed';
      result.realtimeError = err instanceof Error ? err.message : 'Realtime check failed';
    }

    setDiagnostics(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">System Diagnostics</h1>
            <p className="text-sm text-slate-400 mt-0.5">Running diagnostic tests...</p>
          </div>
          <LoadingState />
        </div>
      </AdminShell>
    );
  }

  const testGroups = [
    {
      key: 'connection',
      label: 'Database Connection',
      icon: Database,
      status: diagnostics.connection,
      error: diagnostics.connectionError,
      detail: diagnostics.supabaseUrl ? `URL: ${diagnostics.supabaseUrl}` : 'Not configured',
    },
    {
      key: 'auth',
      label: 'Authentication',
      icon: Shield,
      status: diagnostics.authAvailable,
      error: diagnostics.authError,
      detail: 'Session availability check',
    },
    {
      key: 'profile',
      label: 'Admin Profile Linkage',
      icon: Shield,
      status: diagnostics.profileLinked,
      error: diagnostics.profileError,
      detail: diagnostics.profile
        ? `Signed in as ${diagnostics.profile.fullName || diagnostics.profile.email} (${diagnostics.profile.role})`
        : 'No profile linked',
    },
    {
      key: 'db',
      label: 'Database Queries',
      icon: Server,
      status: diagnostics.dbQuery,
      error: diagnostics.dbQueryError,
      detail: diagnostics.dbQueryResult
        ? `${diagnostics.dbQueryResult.clients} clients, ${diagnostics.dbQueryResult.leads} leads, ${diagnostics.dbQueryResult.projects} projects`
        : 'Query failed',
    },
    {
      key: 'storage',
      label: 'Storage Service',
      icon: HardDrive,
      status: diagnostics.storageReady,
      error: diagnostics.storageError,
      detail: 'Bucket accessibility test',
    },
    {
      key: 'realtime',
      label: 'Realtime',
      icon: Radio,
      status: diagnostics.realtimeReady,
      error: diagnostics.realtimeError,
      detail: 'WebSocket subscription test',
    },
  ];

  const hasAllConnected = testGroups.every((t) => t.status === 'Connected');
  const hasFailures = testGroups.some((t) => t.status === 'Failed');

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">System Diagnostics</h1>
            <p className="text-sm text-slate-400 mt-0.5">Database and service connectivity status</p>
          </div>
          <button
            onClick={runDiagnostics}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Run Tests
          </button>
        </div>

        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
            hasAllConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            hasFailures ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <Activity className="w-4 h-4" />
            {hasAllConnected ? 'All Systems Operational' : hasFailures ? 'System Issues Detected' : 'Partial Connectivity'}
          </div>
        </div>

        <div className="space-y-3">
          {testGroups.map((test) => (
            <div
              key={test.key}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(test.key)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <test.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{test.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{test.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={test.status} />
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expanded[test.key] ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {expanded[test.key] && test.error && (
                <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.06)] pt-4">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs font-mono text-red-400 break-all">{test.error}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">
              Last test: {new Date(diagnostics.lastTestTime).toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-slate-600">Environment: {diagnostics.environment}</span>
        </div>
      </div>
    </AdminShell>
  );
}