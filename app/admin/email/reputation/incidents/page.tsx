'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle, ArrowLeft, Shield, CheckCircle2,
  XCircle, TrendingDown, TrendingUp, Plus, Pause, Lock,
} from 'lucide-react';

interface IncidentRow {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset_name: string | null;
  provider: string | null;
  brand: string | null;
  email_type: string | null;
  detection_source: string | null;
  detection_time: string | null;
  current_metrics: Record<string, unknown> | null;
  baseline_metrics: Record<string, unknown> | null;
  affected_campaigns: string[] | null;
  affected_automations: string[] | null;
  affected_transactional: string[] | null;
  estimated_impact: number | null;
  containment_actions: unknown[] | null;
  timeline: unknown[] | null;
}

const SEVERITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'sev-1': { label: 'SEV-1 — Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  'sev-2': { label: 'SEV-2 — High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'sev-3': { label: 'SEV-3 — Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-red-400', bg: 'bg-red-400/10' },
  investigating: { label: 'Investigating', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  contained: { label: 'Contained', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  recovering: { label: 'Recovering', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  closed: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-400/10' },
};

function num(v: unknown): number | null {
  if (typeof v === 'number') return v;
  return null;
}

export default function ReputationIncidents() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showContainmentPanel, setShowContainmentPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_deliverability_incidents')
        .select('*')
        .order('detection_time', { ascending: false })
        .limit(100);
      const rows = (data || []) as IncidentRow[];
      setIncidents(rows);
      if (rows.length > 0) setSelectedId(rows[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const selectedIncident = incidents.find((i) => i.id === selectedId) || null;

  const statusCounts = (['open', 'investigating', 'contained', 'recovering', 'resolved'] as const).map((status) => ({
    status,
    count: incidents.filter((i) => i.status === status).length,
  }));

  const current = (selectedIncident?.current_metrics || {}) as Record<string, unknown>;
  const baseline = (selectedIncident?.baseline_metrics || {}) as Record<string, unknown>;
  const currentDelivery = num(current.delivery_rate);
  const currentBounce = num(current.bounce_rate);
  const currentComplaints = num(current.complaints ?? current.complaint_rate);
  const baseDelivery = num(baseline.delivery_rate);
  const baseBounce = num(baseline.bounce_rate);
  const baseComplaints = num(baseline.complaints ?? baseline.complaint_rate);

  const containment = (selectedIncident?.containment_actions || []) as { action?: string; time?: string; by?: string }[];
  const timeline = (selectedIncident?.timeline || []) as { event?: string; time?: string }[];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[#121215] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-[#121215] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/email/reputation" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Deliverability Incidents</h1>
            <p className="text-xs text-slate-400 mt-0.5">Incident detection, containment and recovery management</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" /> Report Incident
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statusCounts.map(({ status, count }) => {
          const meta = STATUS_META[status];
          return (
            <div key={status} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
              <p className="text-2xl font-bold text-white mt-1.5">{count}</p>
            </div>
          );
        })}
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-24 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">No deliverability incidents recorded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider px-1">Active & Recent Incidents</p>
            {incidents.map((inc) => {
              const sev = SEVERITY_META[inc.severity] || SEVERITY_META['sev-3'];
              const status = STATUS_META[inc.status] || STATUS_META.open;
              return (
                <button
                  key={inc.id}
                  onClick={() => { setSelectedId(inc.id); setShowContainmentPanel(false); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedId === inc.id
                      ? 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
                      : 'bg-white/[0.02] border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${sev.border} ${sev.bg} ${sev.color}`}>{inc.severity}</span>
                    <span className="text-[10px] text-slate-500">{inc.detection_time ? new Date(inc.detection_time).toLocaleDateString('en-GB') : '—'}</span>
                  </div>
                  <p className="text-sm text-white font-medium">{inc.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-500">{inc.asset_name || '—'}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedIncident && (
              <>
                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${SEVERITY_META[selectedIncident.severity]?.bg || SEVERITY_META['sev-3'].bg} border ${SEVERITY_META[selectedIncident.severity]?.border || SEVERITY_META['sev-3'].border}`} />
                        <span className={`text-xs font-bold uppercase ${SEVERITY_META[selectedIncident.severity]?.color || SEVERITY_META['sev-3'].color}`}>{SEVERITY_META[selectedIncident.severity]?.label || selectedIncident.severity}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_META[selectedIncident.status]?.bg || STATUS_META.open.bg} ${STATUS_META[selectedIncident.status]?.color || STATUS_META.open.color}`}>
                          {STATUS_META[selectedIncident.status]?.label || selectedIncident.status}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white">{selectedIncident.title}</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Detected: {selectedIncident.detection_time ? new Date(selectedIncident.detection_time).toLocaleString('en-GB') : '—'} · {selectedIncident.detection_source || '—'} · {selectedIncident.brand || '—'}
                      </p>
                    </div>
                    {selectedIncident.status !== 'resolved' && selectedIncident.status !== 'closed' && (
                      <div className="flex items-center gap-2">
                        {selectedIncident.status === 'investigating' && (
                          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 transition-colors cursor-pointer whitespace-nowrap">
                            Escalate
                          </button>
                        )}
                        <button
                          onClick={() => setShowContainmentPanel(!showContainmentPanel)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Containment
                        </button>
                      </div>
                    )}
                  </div>

                  {showContainmentPanel && (
                    <div className="mb-6 bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-300 mb-3">Containment Controls</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">
                          <Pause className="w-3.5 h-3.5" /> Pause Sender Profile
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">
                          <Lock className="w-3.5 h-3.5" /> Pause Domain Sending
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">
                          <XCircle className="w-3.5 h-3.5" /> Cancel Unsent Batches
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">
                          <Shield className="w-3.5 h-3.5" /> Activate Kill Switch
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Delivery</p>
                      <p className={`text-lg font-bold ${currentDelivery !== null && currentDelivery < 95 ? 'text-red-400' : 'text-white'}`}>
                        {currentDelivery !== null ? `${currentDelivery}%` : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">Baseline: {baseDelivery !== null ? `${baseDelivery}%` : '—'}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Bounce Rate</p>
                      <p className={`text-lg font-bold ${currentBounce !== null && currentBounce > 2 ? 'text-red-400' : 'text-white'}`}>
                        {currentBounce !== null ? `${currentBounce}%` : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">Baseline: {baseBounce !== null ? `${baseBounce}%` : '—'}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Complaints</p>
                      <p className={`text-lg font-bold ${currentComplaints !== null && currentComplaints > 0.2 ? 'text-red-400' : 'text-white'}`}>
                        {currentComplaints !== null ? `${currentComplaints}%` : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">Baseline: {baseComplaints !== null ? `${baseComplaints}%` : '—'}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Est. Impact</p>
                      <p className="text-lg font-bold text-white">{(selectedIncident.estimated_impact || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">recipients</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Affected</h3>
                      <div className="space-y-1.5">
                        <p className="text-xs text-slate-300">
                          Campaigns: {(selectedIncident.affected_campaigns || []).length} · Automations: {(selectedIncident.affected_automations || []).length} · Transactional: {(selectedIncident.affected_transactional || []).length}
                        </p>
                        <p className="text-xs text-slate-500">Asset: {selectedIncident.asset_name || '—'} · {selectedIncident.provider || '—'} · {selectedIncident.brand || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Containment Actions</h3>
                      {containment.length > 0 ? (
                        <div className="space-y-1.5">
                          {containment.map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <p className="text-xs text-slate-400">{c.action || 'Action'} {c.time ? <span className="text-slate-500">— {new Date(c.time).toLocaleString('en-GB')}</span> : ''}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No containment actions taken</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-3">Incident Timeline</h3>
                  {timeline.length === 0 ? (
                    <p className="text-xs text-slate-500">No timeline events recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((t, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-red-400' : i === timeline.length - 1 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <div>
                            <p className="text-xs text-slate-300">{t.event || 'Event'}</p>
                            <p className="text-[10px] text-slate-500">{t.time ? new Date(t.time).toLocaleString('en-GB') : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedIncident.status !== 'resolved' && selectedIncident.status !== 'closed' && (
                  <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-3">Recovery Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button className="px-4 py-2.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                        Record Root Cause
                      </button>
                      <button className="px-4 py-2.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                        Submit Recovery Plan
                      </button>
                      <button className="px-4 py-2.5 rounded-lg text-xs font-medium bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-colors cursor-pointer whitespace-nowrap">
                        Resolve Incident
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}