'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import {
  NOTICE_VERSION,
  MONITORING_PRIVACY_NOTICE,
  MONITORING_CATEGORY_LABELS,
  type MonitoringSettings,
} from '@/lib/uat-monitoring-definitions';
import { Loader2, Shield, X } from 'lucide-react';

interface UATMonitoringNoticeProps {
  assignmentId: string;
  sessionId: string | null;
  projectId: string;
  onAcknowledged: () => void;
  onCancel: () => void;
  open: boolean;
}

export default function UATMonitoringNotice({
  assignmentId, sessionId, projectId, onAcknowledged, onCancel, open,
}: UATMonitoringNoticeProps) {
  const { tester } = useUATTester();
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setConfirmed(false);
    setAlreadyAcknowledged(false);

    const load = async () => {
      const { data: ack } = await supabase
        .from('uat_monitoring_acknowledgements')
        .select('id')
        .eq('tester_id', tester.id)
        .eq('assignment_id', assignmentId)
        .eq('notice_version', NOTICE_VERSION)
        .is('withdrawn_at', null)
        .maybeSingle();

      if (ack) {
        setAlreadyAcknowledged(true);
        setLoading(false);
        onAcknowledged();
        return;
      }

      const { data: settingsData } = await supabase
        .from('uat_monitoring_settings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (!settingsData) {
        setError('Monitoring settings not found.');
        setLoading(false);
        return;
      }

      const s = settingsData as any;

      if (!s.monitoring_enabled) {
        setLoading(false);
        onAcknowledged();
        return;
      }

      setSettings({
        capture_navigation: s.capture_navigation,
        capture_visibility: s.capture_visibility,
        capture_console_errors: s.capture_console_errors,
        capture_unhandled_rejections: s.capture_unhandled_rejections,
        capture_failed_requests: s.capture_failed_requests,
        capture_slow_requests: s.capture_slow_requests,
        capture_performance: s.capture_performance,
        slow_request_threshold_ms: s.slow_request_threshold_ms,
      });
      setLoading(false);
    };

    load();
  }, [open, tester.id, assignmentId, projectId, onAcknowledged]);

  const handleAcknowledge = async () => {
    if (!confirmed || acknowledging) return;
    setAcknowledging(true);
    setError('');

    const categories: Record<string, boolean> = {};
    if (settings) {
      if (settings.capture_navigation) categories.navigation = true;
      if (settings.capture_visibility) categories.visibility = true;
      if (settings.capture_console_errors) categories.console_errors = true;
      if (settings.capture_unhandled_rejections) categories.unhandled_rejections = true;
      if (settings.capture_failed_requests) categories.failed_requests = true;
      if (settings.capture_slow_requests) categories.slow_requests = true;
      if (settings.capture_performance) categories.performance = true;
    }

    const { data, error: rpcErr } = await supabase.rpc('acknowledge_uat_monitoring', {
      p_assignment_id: assignmentId,
      p_session_id: sessionId,
      p_notice_version: NOTICE_VERSION,
      p_monitoring_categories: categories,
    });

    setAcknowledging(false);

    if (rpcErr) { setError(rpcErr.message); return; }
    const result = data as any;
    if (!result?.success) { setError(result?.message || 'Failed to acknowledge.'); return; }

    onAcknowledged();
  };

  if (!open) return null;

  const activeCategories = settings ? Object.entries({
    navigation: settings.capture_navigation,
    visibility: settings.capture_visibility,
    console_errors: settings.capture_console_errors,
    unhandled_rejections: settings.capture_unhandled_rejections,
    failed_requests: settings.capture_failed_requests,
    slow_requests: settings.capture_slow_requests,
    performance: settings.capture_performance,
  }).filter(([, v]) => v).map(([k]) => k) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2878d0]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#2878d0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17325c]">Monitoring Enabled</h3>
              <p className="text-xs text-amber-600 font-medium">Please read and acknowledge</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2878d0]" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="text-sm text-slate-600 leading-relaxed">
              I understand what will be recorded during this authorised UAT session.
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2878d0] mb-2">What DFP May Record</div>
              <ul className="space-y-1.5">
                {(activeCategories.length > 0 ? activeCategories : Object.keys(MONITORING_CATEGORY_LABELS)).map((cat) => (
                  <li key={cat} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-[#2878d0]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2878d0]" />
                    </span>
                    {MONITORING_CATEGORY_LABELS[cat] || cat}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">What DFP Does Not Record</div>
              <ul className="space-y-1.5">
                {MONITORING_PRIVACY_NOTICE.notRecorded.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <a href="/privacy" target="_blank" className="text-[#2878d0] hover:underline">Privacy Information</a>
              <span>·</span>
              <a href="/terms" target="_blank" className="text-[#2878d0] hover:underline">Tester Terms</a>
              <span>·</span>
              <a href="/account/help" target="_blank" className="text-[#2878d0] hover:underline">Account Help</a>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <input
                type="checkbox"
                id="monitoring-confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer"
              />
              <label htmlFor="monitoring-confirm" className="text-sm text-slate-600 cursor-pointer select-none">
                I have checked that this evidence does not contain unrelated personal or confidential information.
              </label>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 p-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            onClick={handleAcknowledge}
            disabled={!confirmed || acknowledging || loading || !!error}
            className="px-4 py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2"
          >
            {acknowledging ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Accept and Continue
          </button>
        </div>
      </div>
    </div>
  );
}