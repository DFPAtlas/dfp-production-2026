'use client';

import { useState, useCallback } from 'react';
import { motion } from '@/components/motion';
import { X, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw, ChevronRight, Info } from 'lucide-react';
import { ValidationResult, ValidationIssue } from './email-validator';

interface ValidationPanelProps {
  open: boolean;
  onClose: () => void;
  result: ValidationResult | null;
  onRun: () => void;
  onNavigateToBlock: (blockId: string) => void;
  onNavigateToSetting: (setting: string) => void;
  loading: boolean;
}

export default function ValidationPanel({ open, onClose, result, onRun, onNavigateToBlock, onNavigateToSetting, loading }: ValidationPanelProps) {
  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end overflow-y-auto"
      onClick={onClose}
    >
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
        className="w-full max-w-lg h-full bg-[#0f0f13] border-l border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h3 className="text-base font-bold text-white">Template Validation</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Pre-publish checks and safety review</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/10 border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-5">
                <ShieldCheck className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Not yet checked</p>
              <p className="text-xs text-slate-500 max-w-xs mb-6">Run validation to check this template for errors, warnings and best-practice recommendations.</p>
              <button onClick={onRun}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" />
                Run Validation
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400">Running validation...</p>
            </div>
          )}

          {result && !loading && (
            <div className="p-5 space-y-5">
              <StatusBar result={result} />
              <button onClick={onRun}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Revalidate
              </button>

              {result.errors.length > 0 && (
                <IssueGroup title="Errors" icon={AlertTriangle} color="text-red-400" bgColor="bg-red-500/10" borderColor="border-red-500/20" issues={result.errors} onNavigate={onNavigateToBlock} onNavigateSetting={onNavigateToSetting} />
              )}
              {result.warnings.length > 0 && (
                <IssueGroup title="Warnings" icon={AlertCircle} color="text-amber-400" bgColor="bg-amber-500/10" borderColor="border-amber-500/20" issues={result.warnings} onNavigate={onNavigateToBlock} onNavigateSetting={onNavigateToSetting} />
              )}
              {result.recommendations.length > 0 && (
                <IssueGroup title="Recommendations" icon={Info} color="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" issues={result.recommendations} onNavigate={onNavigateToBlock} onNavigateSetting={onNavigateToSetting} />
              )}
              {result.passed.length > 0 && (
                <IssueGroup title="Passed" icon={CheckCircle2} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/20" issues={result.passed} onNavigate={onNavigateToBlock} onNavigateSetting={onNavigateToSetting} collapsed />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusBar({ result }: { result: ValidationResult }) {
  const config: Record<string, { icon: typeof ShieldCheck; color: string; bg: string; label: string }> = {
    valid: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'All checks passed' },
    ready: { icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Ready for review' },
    needs_attention: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Needs attention' },
    not_checked: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Not checked' },
  };
  const cfg = config[result.status] || config.not_checked;
  const Icon = cfg.icon;

  return (
    <div className={`${cfg.bg} border border-[rgba(255,255,255,0.06)] rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${cfg.color}`} />
        <div>
          <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
          <div className="flex items-center gap-3 mt-1">
            {result.errors.length > 0 && <span className="text-[11px] text-red-400">{result.errors.length} error{result.errors.length !== 1 ? 's' : ''}</span>}
            {result.warnings.length > 0 && <span className="text-[11px] text-amber-400">{result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}</span>}
            {result.recommendations.length > 0 && <span className="text-[11px] text-blue-400">{result.recommendations.length} tip{result.recommendations.length !== 1 ? 's' : ''}</span>}
            {result.passed.length > 0 && <span className="text-[11px] text-emerald-400">{result.passed.length} passed</span>}
          </div>
          {result.lastValidated && (
            <p className="text-[10px] text-slate-600 mt-1">Last checked: {new Date(result.lastValidated).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueGroup({ title, icon: Icon, color, bgColor, borderColor, issues, onNavigate, onNavigateSetting, collapsed: defaultCollapsed }: {
  title: string;
  icon: typeof ShieldCheck;
  color: string;
  bgColor: string;
  borderColor: string;
  issues: ValidationIssue[];
  onNavigate: (blockId: string) => void;
  onNavigateSetting: (setting: string) => void;
  collapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed || false);

  return (
    <div>
      <button onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center gap-2 text-xs font-semibold ${color} uppercase tracking-wider mb-2 cursor-pointer`}
      >
        <Icon className="w-3.5 h-3.5" />
        {title} ({issues.length})
        <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${collapsed ? '' : 'rotate-90'}`} />
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div key={i} className={`${bgColor} border ${borderColor} rounded-lg p-3`}>
              <p className="text-xs font-semibold text-white mb-1">{issue.title}</p>
              <p className="text-[11px] text-slate-400 mb-2">{issue.explanation}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-500">{issue.suggestedFix}</span>
                {issue.affectedBlockId && (
                  <button onClick={() => onNavigate(issue.affectedBlockId!)}
                    className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap ml-auto"
                  >
                    Go to block
                  </button>
                )}
                {issue.affectedSetting && (
                  <button onClick={() => onNavigateSetting(issue.affectedSetting!)}
                    className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap ml-auto"
                  >
                    Open setting
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
