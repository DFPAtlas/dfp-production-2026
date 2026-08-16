'use client';

import {
  ArrowLeft, Undo2, Redo2, Monitor, Smartphone, Eye, Send,
  Save, MoreHorizontal, Check, AlertTriangle, Clock,
  ShieldCheck, MessageSquare, History,
} from 'lucide-react';
import Link from 'next/link';

interface EditorToolbarProps {
  templateName: string;
  onNameChange: (name: string) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  errorMessage: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreviewMode: () => void;
  onDesktopPreview: () => void;
  onMobilePreview: () => void;
  onSendTest: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  previewMode: 'desktop' | 'mobile' | null;
  inlineEditing: boolean;
  onValidate: () => void;
  onReview: () => void;
  onHistory: () => void;
  validationStatus: 'not_checked' | 'needs_attention' | 'ready' | 'valid' | 'outdated';
  onSaveAndExit: () => void;
}

export default function EditorToolbar({
  templateName, onNameChange, saveStatus, errorMessage,
  canUndo, canRedo, onUndo, onRedo, onSave,
  onPreviewMode, onDesktopPreview, onMobilePreview, onSendTest,
  onDuplicate, onArchive, previewMode, inlineEditing,
  onValidate, onReview, onHistory, validationStatus,
  onSaveAndExit,
}: EditorToolbarProps) {
  const statusConfig = {
    saved: { icon: Check, color: 'text-emerald-400', label: 'Saved' },
    saving: { icon: Clock, color: 'text-amber-400', label: 'Saving...' },
    unsaved: { icon: AlertTriangle, color: 'text-amber-400', label: 'Unsaved changes' },
    error: { icon: AlertTriangle, color: 'text-red-400', label: errorMessage || 'Save failed' },
  };

  const cfg = statusConfig[saveStatus];
  const StatusIcon = cfg.icon;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0c] border-b border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/email/templates"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <input
          type="text"
          value={templateName}
          onChange={(e) => {
            const val = e.target.value.slice(0, 100);
            onNameChange(val);
          }}
          className="bg-transparent text-sm font-semibold text-white border-b border-transparent hover:border-[rgba(255,255,255,0.1)] focus:border-[#06B6D4] focus:outline-none px-1 py-0.5 min-w-[120px] transition-colors"
          placeholder="Template name"
        />

        <div className="flex items-center gap-1.5 ml-2">
          <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
          <span className={`text-[11px] ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[rgba(255,255,255,0.06)] mx-1.5" />

        <button
          onClick={onDesktopPreview}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            previewMode === 'desktop' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'hover:bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
          title="Desktop preview"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={onMobilePreview}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            previewMode === 'mobile' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'hover:bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
          title="Mobile preview"
        >
          <Smartphone className="w-4 h-4" />
        </button>
        <button
          onClick={onPreviewMode}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            inlineEditing ? '' : 'bg-[#06B6D4]/10 text-[#06B6D4]'
          } hover:bg-white/[0.04] text-slate-400 hover:text-white`}
          title="Preview mode"
        >
          <Eye className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[rgba(255,255,255,0.06)] mx-1.5" />

        <button
          onClick={onSendTest}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          title="Send test"
        >
          <Send className="w-4 h-4" />
        </button>

        <button
          onClick={onValidate}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            validationStatus === 'needs_attention' ? 'bg-red-500/10 text-red-400' :
            validationStatus === 'outdated' ? 'bg-amber-500/10 text-amber-400' :
            validationStatus === 'ready' ? 'bg-blue-500/10 text-blue-400' :
            validationStatus === 'valid' ? 'bg-emerald-500/10 text-emerald-400' :
            'hover:bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
          title="Validate"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
        <button
          onClick={onReview}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
          title="Review & Approval"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={onHistory}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          title="Version History"
        >
          <History className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[rgba(255,255,255,0.06)] mx-1.5" />

        <button
          onClick={onSave}
          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06B6D4] text-white text-xs font-semibold hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap ml-1"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>

        <button
          onClick={onSaveAndExit}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
        >
          <Save className="w-3.5 h-3.5" />
          Save &amp; Exit
        </button>

        <div className="relative group">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-10 w-48 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button onClick={onDuplicate} className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">Duplicate</button>
            <button onClick={onArchive} className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">Archive</button>
            <div className="border-t border-[rgba(255,255,255,0.06)]" />
            <Link href="/admin/email/templates" className="block px-3 py-2.5 text-xs text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer">Return to Library</Link>
          </div>
        </div>
      </div>
    </div>
  );
}