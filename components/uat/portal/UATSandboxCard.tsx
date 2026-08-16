'use client';

import { Box, Clock, Server, Wifi, WifiOff, ChevronRight } from 'lucide-react';
import { SANDBOX_STATUS_CONFIG, SANDBOX_MODE_CONFIG, formatTimeRemaining } from '@/lib/uat-sandbox/types';
import type { SandboxStatus } from '@/lib/uat-sandbox/types';

interface SandboxCardProps {
  status: string | null;
  mode: string | null;
  healthStatus: string | null;
  expiresAt: string | null;
  resetCount: number;
  sandboxUrl: string | null;
  accountCount: number;
  onNavigate: () => void;
  workerOnline?: boolean;
}

export default function UATSandboxCard({
  status, mode, healthStatus, expiresAt, resetCount, sandboxUrl, accountCount, onNavigate,
  workerOnline,
}: SandboxCardProps) {
  if (!status) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#17325c] flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-500" /> Sandbox
          </h3>
          <span className="text-xs text-slate-400">Not active</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">Request a sandbox for controlled test environment access.</p>
        <button onClick={onNavigate}
          className="w-full py-2.5 bg-cyan-50 hover:bg-cyan-100 rounded-xl text-sm font-semibold text-cyan-600 cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1">
          Open Sandbox <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const sc = SANDBOX_STATUS_CONFIG[status as SandboxStatus] || { label: status, color: '#94A3B8', bg: 'bg-slate-500/10' };
  const mc = SANDBOX_MODE_CONFIG[mode as keyof typeof SANDBOX_MODE_CONFIG];
  const isTerminal = ['ended', 'expired', 'failed'].includes(status);
  const isWorkerBacked = ['ready', 'active', 'paused', 'resetting'].includes(status);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#17325c] flex items-center gap-2">
          <Box className="w-4 h-4 text-cyan-500" /> Sandbox
        </h3>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold" style={{ color: sc.color, backgroundColor: sc.bg }}>
          {sc.label}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Mode</span>
          <span className="text-[#17325c] font-medium" style={{ color: mc?.color }}>{mc?.label || mode}</span>
        </div>
        {!isTerminal && expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Expires</span>
            <span className="text-[#17325c] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTimeRemaining(expiresAt)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Resets</span>
          <span className="text-[#17325c] font-medium">{resetCount}</span>
        </div>
        {isWorkerBacked && workerOnline !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Worker</span>
            <span className={`font-medium flex items-center gap-1 ${workerOnline ? 'text-emerald-600' : 'text-red-500'}`}>
              {workerOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {workerOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        )}
        {accountCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Accounts</span>
            <span className="text-[#17325c] font-medium">{accountCount}</span>
          </div>
        )}
      </div>

      {sandboxUrl && !isTerminal && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <a href={sandboxUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline font-mono truncate max-w-full">
            {sandboxUrl}
          </a>
        </div>
      )}

      {!isTerminal && workerOnline === false && isWorkerBacked && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700">Browser isolation worker offline. Data and evidence are preserved.</p>
        </div>
      )}

      <button onClick={onNavigate}
        className="w-full mt-3 py-2.5 bg-cyan-50 hover:bg-cyan-100 rounded-xl text-sm font-semibold text-cyan-600 cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-1">
        {isTerminal ? 'View Sandbox' : 'Manage Sandbox'} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}