'use client';

import { motion } from '@/components/motion';
import {
  Radar, Activity, Wifi, WifiOff, AlertTriangle,
  Clock, Flag, Eye, FileWarning, Zap, Loader2,
} from 'lucide-react';
import type { MonitorConnectionStatus } from '@/lib/uat-monitor/types';

interface MonitoringCardProps {
  status: MonitorConnectionStatus;
  lastEventAt: string | null;
  currentPage: string | null;
  errorCount: number;
  failedRequestCount: number;
  slowRequestCount: number;
  checkpointCount: number;
  pageViewCount: number;
  onOpenTestWebsite: () => void;
  onReconnect: () => void;
  onAddCheckpoint: () => void;
  onViewEvents: () => void;
  sessionActive: boolean;
}

const statusConfig: Record<MonitorConnectionStatus, { label: string; color: string; bg: string; icon: any }> = {
  not_enabled: { label: 'Not Enabled', color: '#94A3B8', bg: 'bg-slate-100', icon: WifiOff },
  connecting: { label: 'Connecting', color: '#F59E0B', bg: 'bg-amber-100', icon: Loader2 },
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-100', icon: Wifi },
  paused: { label: 'Paused', color: '#F59E0B', bg: 'bg-amber-100', icon: Activity },
  degraded: { label: 'Degraded', color: '#F97316', bg: 'bg-orange-100', icon: AlertTriangle },
  disconnected: { label: 'Disconnected', color: '#EF4444', bg: 'bg-red-100', icon: WifiOff },
  expired: { label: 'Expired', color: '#6B7280', bg: 'bg-slate-100', icon: Clock },
};

export default function MonitoringCard({
  status, lastEventAt, currentPage,
  errorCount, failedRequestCount, slowRequestCount,
  checkpointCount, pageViewCount,
  onOpenTestWebsite, onReconnect, onAddCheckpoint, onViewEvents,
  sessionActive,
}: MonitoringCardProps) {
  const sc = statusConfig[status] || statusConfig.not_enabled;
  const isActive = status === 'active';
  const isPaused = status === 'paused';
  const isError = status === 'degraded' || status === 'disconnected' || status === 'expired';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center`}>
            <sc.icon className="w-4.5 h-4.5" style={{ color: sc.color }} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#17325c]">Technical Monitoring</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
              <span className="text-xs font-semibold" style={{ color: sc.color }}>{sc.label}</span>
            </div>
          </div>
        </div>

        {isActive && sessionActive && (
          <div className="flex items-center gap-1.5">
            <button onClick={onAddCheckpoint}
              className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-xs font-semibold text-cyan-600 cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors">
              <Flag className="w-3 h-3" /> Checkpoint
            </button>
            <button onClick={onViewEvents}
              className="px-3 py-1.5 bg-[#2878d0]/5 hover:bg-[#2878d0]/10 border border-[#2878d0]/15 rounded-lg text-xs font-semibold text-[#2878d0] cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors">
              <Eye className="w-3 h-3" /> Events
            </button>
          </div>
        )}

        {isError && (
          <button onClick={onReconnect}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-600 cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors">
            <Activity className="w-3 h-3" /> Reconnect
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Eye className="w-3 h-3 text-slate-400" />
              <span className="text-lg font-bold text-[#17325c]">{pageViewCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Page Views</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileWarning className="w-3 h-3 text-red-400" />
              <span className="text-lg font-bold text-[#17325c]">{errorCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">JS Errors</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-orange-400" />
              <span className="text-lg font-bold text-[#17325c]">{failedRequestCount + slowRequestCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Req Issues</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flag className="w-3 h-3 text-cyan-400" />
              <span className="text-lg font-bold text-[#17325c]">{checkpointCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Checkpoints</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium mb-0.5">Last Event</div>
            <p className="text-xs font-semibold text-[#17325c]">
              {lastEventAt ? new Date(lastEventAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
            </p>
          </div>
        </div>

        {currentPage && (
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 font-medium mb-1">Current Page</p>
            <p className="text-xs text-slate-600 font-mono truncate">{currentPage}</p>
          </div>
        )}

        {(isPaused || isError) && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Technical monitoring is temporarily unavailable. Your test-case work is still being saved.
            </p>
          </div>
        )}

        {sessionActive && (
          <button onClick={onOpenTestWebsite}
            className="w-full mt-3 py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1.5">
            <Radar className="w-3.5 h-3.5" /> Open Test Website
          </button>
        )}
      </div>
    </motion.div>
  );
}