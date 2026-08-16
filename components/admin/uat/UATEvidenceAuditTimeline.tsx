'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, History } from 'lucide-react';

interface EvidenceEvent {
  id: string;
  evidence_id: string;
  event_type: string;
  actor_user_id: string;
  created_at: string;
  metadata: any;
}

export default function UATEvidenceAuditTimeline({ evidenceId }: { evidenceId: string }) {
  const [events, setEvents] = useState<EvidenceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!evidenceId) return;
    supabase.from('uat_evidence_events').select('*').eq('evidence_id', evidenceId).order('created_at', { ascending: true }).then(({ data }) => {
      setEvents((data || []) as EvidenceEvent[]);
      setLoading(false);
    });
  }, [evidenceId]);

  const eventLabels: Record<string, { label: string; color: string }> = {
    uploaded: { label: 'Uploaded', color: 'bg-sky-500' },
    attached_to_case: { label: 'Attached to test case', color: 'bg-emerald-500' },
    attached_to_feedback: { label: 'Attached to bug report', color: 'bg-violet-500' },
    viewed: { label: 'Viewed', color: 'bg-slate-400' },
    downloaded: { label: 'Downloaded', color: 'bg-slate-400' },
    quarantined: { label: 'Quarantined', color: 'bg-amber-500' },
    rejected: { label: 'Rejected', color: 'bg-red-500' },
    soft_deleted: { label: 'Soft Deleted', color: 'bg-red-400' },
    restored: { label: 'Restored', color: 'bg-emerald-400' },
  };

  if (loading) return <div className="py-4 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>;
  if (events.length === 0) return <div className="py-4 text-xs text-slate-400 text-center">No audit events recorded.</div>;

  return (
    <div className="relative pl-6 border-l-2 border-slate-100 space-y-4">
      {events.map((ev) => {
        const info = eventLabels[ev.event_type] || { label: ev.event_type, color: 'bg-slate-400' };
        return (
          <div key={ev.id} className="relative">
            <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full ${info.color}`} />
            <p className="text-xs font-semibold text-slate-700">{info.label}</p>
            <p className="text-[11px] text-slate-400">{new Date(ev.created_at).toLocaleString('en-GB')}</p>
          </div>
        );
      })}
    </div>
  );
}