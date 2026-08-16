import Link from 'next/link';
import { FileEdit, ArrowLeft } from 'lucide-react';

export default function DraftsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-5">
        <FileEdit className="w-7 h-7 text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Drafts</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        A central place for all your draft email templates and campaigns. This feature is being built.
      </p>
      <Link
        href="/admin/email"
        className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Email Studio
      </Link>
    </div>
  );
}