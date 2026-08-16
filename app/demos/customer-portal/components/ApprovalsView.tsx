'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, CheckCircle2, MessageSquareText, FileText } from 'lucide-react';
import { ApprovalDecision } from '../lib/types';

interface ApprovalsViewProps {
  decision: ApprovalDecision;
  onDecision: (decision: ApprovalDecision) => void;
  onActivity: (msg: string) => void;
}

export default function ApprovalsView({
  decision,
  onDecision,
  onActivity,
}: ApprovalsViewProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    onActivity(`Reviewed design item: ${item}.`);
  };

  const handleApprove = () => {
    onDecision('approved');
    onActivity('Dashboard prototype v3 approved by Daniel.');
  };

  const handleChanges = () => {
    onDecision('changes');
    onActivity('Change request sent for dashboard prototype v3.');
  };

  const checklist = [
    'Navigation and menu structure',
    'Key metrics and data cards',
    'Colour and brand consistency',
    'Mobile responsive layout',
    'Call-to-action placement',
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#1a2332]">Design Review & Approval</h2>
        <p className="mt-1 text-sm text-[#6b7b8e]">
          Review the latest deliverable, approve it or send a structured change request.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
                  Final Dashboard Design
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#1a2332]">
                  Dashboard Prototype v3
                </h3>
                <p className="mt-1 text-xs text-[#8a8a8a]">
                  Uploaded by Amelia Hart &middot; 7 Aug 2026 &middot; Revision 3
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                decision === 'approved'
                  ? 'bg-[#10b981]/10 text-[#059669]'
                  : decision === 'changes'
                    ? 'bg-[#f59e0b]/10 text-[#d97706]'
                    : 'bg-[#3b82f6]/10 text-[#3b82f6]'
              }`}>
                {decision === 'approved' ? 'Approved' : decision === 'changes' ? 'Changes Requested' : 'Awaiting your approval'}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#e8e5df] bg-[#fafaf8]">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="https://readdy.ai/api/search-image?query=A%20clean%2C%20modern%20business%20dashboard%20UI%20design%20mockup%20displayed%20on%20a%20light%20background.%20The%20dashboard%20shows%20key%20metrics%20cards%20with%20soft%20blue%20and%20teal%20accents%2C%20a%20navigation%20sidebar%20on%20the%20left%20in%20deep%20navy%2C%20data%20visualisation%20charts%20with%20rounded%20corners%2C%20and%20a%20content%20area%20with%20project%20cards%20showing%20progress%20bars.%20The%20overall%20aesthetic%20is%20premium%2C%20minimalist%20and%20professional%20with%20generous%20whitespace%2C%20rounded%20corners%2C%20and%20a%20warm%20off-white%20canvas.%20No%20text%20other%20than%20generic%20placeholder%20labels.%20High%20quality%20UI%20design%20render%20with%20subtle%20shadows%20and%20soft%20gradients.&width=800&height=500&seq=portal1&orientation=landscape"
                  alt="Dashboard prototype v3 design mockup"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  unoptimized
                />
              </div>
              <div className="flex items-center gap-3 border-t border-[#e8e5df] px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b82f6]/10">
                  <FileText className="h-4 w-4 text-[#3b82f6]" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#1a2332]">Dashboard prototype v3</p>
                  <p className="text-[10px] text-[#8a8a8a]">PDF &middot; 8.1 MB &middot; 7 Aug 2026</p>
                </div>
                <button
                  type="button"
                  onClick={() => onActivity('Opened design concept in preview.')}
                  className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[10px] font-medium text-[#6b7b8e] transition hover:bg-[#f6f5f2]"
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-4">
              <p className="text-xs font-semibold text-[#1a2332]">Project Manager Note</p>
              <p className="mt-2 text-xs leading-5 text-[#6b7b8e]">
                Hi Daniel, this revision simplifies the navigation, increases the contrast on key metric cards by 20%, and consolidates the two call-to-action buttons into one primary action to reduce cognitive load. Please review and let me know if you are happy to approve.
              </p>
            </div>

            {decision === 'pending' && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Design
                </button>
                <button
                  type="button"
                  onClick={handleChanges}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e8e5df] bg-white px-4 py-3 text-sm font-medium text-[#6b7b8e] transition hover:bg-[#f6f5f2]"
                >
                  <MessageSquareText className="h-4 w-4" />
                  Request Changes
                </button>
              </div>
            )}

            {decision !== 'pending' && (
              <div className={`mt-4 rounded-xl border p-4 ${
                decision === 'approved'
                  ? 'border-[#10b981]/20 bg-[#f0fdf4]'
                  : 'border-[#f59e0b]/20 bg-[#fffbeb]'
              }`}>
                <div className="flex items-center gap-2">
                  {decision === 'approved' ? (
                    <Check className="h-5 w-5 text-[#10b981]" />
                  ) : (
                    <MessageSquareText className="h-5 w-5 text-[#f59e0b]" />
                  )}
                  <span className={`text-sm font-semibold ${decision === 'approved' ? 'text-[#059669]' : 'text-[#d97706]'}`}>
                    {decision === 'approved' ? 'Design approved' : 'Changes requested'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#6b7b8e]">
                  {decision === 'approved'
                    ? 'Thank you. Your project has automatically moved to the next stage. The build team will begin final launch preparation.'
                    : 'The project team has received your change request and will prepare a revised concept within 48 hours.'}
                </p>
              </div>
            )}

            <p className="mt-3 text-[10px] text-[#8a8a8a]">
              <i className="ri-information-line mr-1"></i>
              Demo only — approval will simulate the workflow. No real message is sent.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1a2332]">Review Checklist</h3>
            <p className="mt-1 text-xs text-[#8a8a8a]">Tick items as you review the concept.</p>
            <div className="mt-4 space-y-2">
              {checklist.map((item) => {
                const checked = checkedItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleCheck(item)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-3 text-left transition hover:border-[#3b82f6]/30"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                      checked ? 'bg-[#10b981] text-white' : 'border-2 border-[#e8e5df]'
                    }`}>
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`text-xs ${checked ? 'text-[#1a2332] line-through' : 'text-[#6b7b8e]'}`}>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1a2332]">Design Notes</h3>
            <div className="mt-3 space-y-3 text-xs text-[#6b7b8e]">
              <p>The v3 revision increases metric card contrast by 20%.</p>
              <p>Navigation items have been reduced from seven to five for clarity.</p>
              <p>The primary call-to-action is now singular and positioned above the fold.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}