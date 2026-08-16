'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  MessageSquareText,
  FolderOpen,
  CirclePoundSterling,
  ChevronRight,
} from 'lucide-react';
import { ApprovalDecision, ActivityEvent, PortalMessage, PortalFile, Invoice, ViewKey } from '../lib/types';

interface OverviewViewProps {
  progress: number;
  decision: ApprovalDecision;
  onNavigate: (view: ViewKey) => void;
  activity: ActivityEvent[];
  messages: PortalMessage[];
  files: PortalFile[];
  invoices: Invoice[];
  onActivity: (msg: string) => void;
  onMessagePM: () => void;
}

export default function OverviewView({
  progress,
  decision,
  onNavigate,
  activity,
  messages,
  files,
  invoices,
  onActivity,
  onMessagePM,
}: OverviewViewProps) {
  const [showAllActivity, setShowAllActivity] = useState(false);
  const paidTotal = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const latestFiles = files.slice(0, 3);
  const latestMessages = messages.slice(-2);
  const displayActivity = showAllActivity ? activity : activity.slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-xs text-[#8a8a8a]">Good afternoon, Daniel.</p>
        <h2 className="mt-1 text-xl font-semibold text-[#1a2332]">
          Everything is moving well.
        </h2>
        <p className="mt-2 text-sm text-[#6b7b8e]">
          Your project is {progress}% complete and currently on track.
          {decision === 'pending'
            ? ' The next thing we need from you is approval of the final dashboard design.'
            : ' The dashboard has been approved and we are preparing for final launch review.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`rounded-2xl border p-5 ${decision === 'pending' ? 'border-[#f59e0b]/30 bg-[#fffbeb]' : 'border-[#10b981]/20 bg-[#f0fdf4]'} lg:col-span-1`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
            Your Next Action
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#1a2332]">
            {decision === 'pending' ? 'Review & Approve' : 'Dashboard Approved'}
          </h3>
          <p className="mt-1 text-sm text-[#6b7b8e]">
            {decision === 'pending'
              ? 'Please review the latest dashboard prototype and provide your feedback or approval.'
              : 'Thank you. Your project has automatically moved to the next stage.'}
          </p>
          {decision === 'pending' && (
            <>
              <div className="mt-4 flex items-center gap-4 text-xs text-[#8a8a8a]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />2 minutes
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-calendar-line text-sm"></i>Due today
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('approvals');
                    onActivity('Opened next action: Review & Approve dashboard.');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                >
                  Review & Approve
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMessagePM();
                    onActivity('Opened message composer from next action.');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e5df] bg-white px-4 py-2.5 text-sm font-medium text-[#6b7b8e] transition hover:bg-[#f6f5f2]"
                >
                  Ask a Question
                </button>
              </div>
            </>
          )}
          {decision === 'approved' && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#10b981]/10 px-4 py-3">
              <Check className="h-5 w-5 text-[#10b981]" />
              <span className="text-sm font-medium text-[#059669]">
                Approved just now
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
            Project Journey
          </p>
          <div className="mt-4 flex items-center justify-between">
            {[
              { label: 'Discovery', done: true },
              { label: 'Design', done: true },
              { label: 'Build', done: true },
              { label: 'Review', done: decision === 'approved', current: decision === 'pending' },
              { label: 'Launch', done: false },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      stage.done
                        ? 'bg-[#10b981] text-white'
                        : stage.current
                          ? 'border-2 border-[#3b82f6] bg-white text-[#3b82f6]'
                          : 'border-2 border-[#e8e5df] bg-white text-[#8a8a8a]'
                    }`}
                  >
                    {stage.done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`mt-2 text-[10px] font-medium ${stage.current ? 'text-[#3b82f6]' : stage.done ? 'text-[#059669]' : 'text-[#8a8a8a]'}`}>
                    {stage.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`mx-1 h-px flex-1 ${stage.done ? 'bg-[#10b981]' : 'bg-[#e8e5df]'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#f6f5f2] px-3 py-2.5">
            <p className="text-xs text-[#6b7b8e]">
              <i className="ri-sparkling-line mr-1 text-[#3b82f6]"></i>
              {decision === 'pending'
                ? "Great progress! We're looking forward to your feedback on the design."
                : 'Excellent! The dashboard is approved. Launch preparation begins next.'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
              Messages
            </p>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-xs font-medium text-[#3b82f6] transition hover:text-[#2563eb]"
            >
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {latestMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${msg.client ? 'bg-[#1a2332] text-white' : 'bg-[#3b82f6]/10 text-[#3b82f6]'}`}>
                  {msg.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#1a2332]">{msg.author}</span>
                    <span className="text-[10px] text-[#8a8a8a]">{msg.time}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#6b7b8e]">{msg.body}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('messages')}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e5df] bg-white px-4 py-2 text-xs font-medium text-[#6b7b8e] transition hover:bg-[#f6f5f2]"
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Send a Message
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
              Recent Activity
            </p>
            <button
              type="button"
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-xs font-medium text-[#3b82f6] transition hover:text-[#2563eb]"
            >
              {showAllActivity ? 'Show less' : 'View all'}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {displayActivity.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  evt.type === 'milestone' ? 'bg-[#10b981]/10 text-[#10b981]' :
                  evt.type === 'approval' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                  evt.type === 'file' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                  evt.type === 'payment' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' :
                  'bg-[#e8e5df] text-[#8a8a8a]'
                }`}>
                  <i className={`ri-${
                    evt.type === 'milestone' ? 'flag-fill' :
                    evt.type === 'approval' ? 'checkbox-circle-fill' :
                    evt.type === 'file' ? 'file-list-3-line' :
                    evt.type === 'payment' ? 'bank-card-line' :
                    'time-line'
                  } text-xs`}></i>
                </span>
                <div>
                  <p className="text-xs font-medium text-[#1a2332]">{evt.label}</p>
                  <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{evt.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
              Project Files
            </p>
            <button
              type="button"
              onClick={() => onNavigate('files')}
              className="text-xs font-medium text-[#3b82f6] transition hover:text-[#2563eb]"
            >
              View all
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {latestFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 rounded-xl border border-[#e8e5df] bg-[#fafaf8] px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#1a2332]">{file.name}</p>
                  <p className="text-[10px] text-[#8a8a8a]">{file.uploadedBy} &middot; {file.date}</p>
                </div>
                {file.status && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    file.status === 'Approved' ? 'bg-[#10b981]/10 text-[#059669]' :
                    file.status === 'Needs Review' ? 'bg-[#f59e0b]/10 text-[#d97706]' :
                    'bg-[#e8e5df] text-[#8a8a8a]'
                  }`}>
                    {file.status}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('files')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3b82f6] transition hover:text-[#2563eb]"
          >
            <i className="ri-add-line"></i>Upload File
          </button>
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
              Payments
            </p>
            <button
              type="button"
              onClick={() => onNavigate('billing')}
              className="text-xs font-medium text-[#3b82f6] transition hover:text-[#2563eb]"
            >
              View details
            </button>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1a2332]">
                £{paidTotal.toLocaleString()}
              </span>
              <span className="text-xs text-[#8a8a8a]">of £{total.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#e8e5df]">
              <div
                className="h-2 rounded-full bg-[#3b82f6] transition-all duration-700"
                style={{ width: `${(paidTotal / total) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#8a8a8a]">
              {invoices.filter((i) => i.status === 'Paid').length} of {invoices.length} payments completed
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {invoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg bg-[#fafaf8] px-3 py-2">
                <div className="flex items-center gap-2">
                  {inv.status === 'Paid' ? (
                    <Check className="h-3.5 w-3.5 text-[#10b981]" />
                  ) : (
                    <CirclePoundSterling className="h-3.5 w-3.5 text-[#8a8a8a]" />
                  )}
                  <span className="text-xs text-[#1a2332]">{inv.label}</span>
                </div>
                <span className={`text-xs font-semibold ${inv.status === 'Paid' ? 'text-[#059669]' : 'text-[#1a2332]'}`}>
                  £{inv.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Overall Progress', value: `${progress}%`, icon: 'ri-bar-chart-box-line', color: '#3b82f6' },
          { label: 'Days Remaining', value: '12', icon: 'ri-calendar-check-line', color: '#0d9488' },
          { label: 'Next Approval', value: decision === 'pending' ? 'Dashboard' : 'None', icon: 'ri-file-check-line', color: '#f59e0b' },
          { label: 'Project Health', value: 'On Track', icon: 'ri-heart-pulse-line', color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#e8e5df] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8a8a]">{stat.label}</span>
              <i className={`${stat.icon} text-lg`} style={{ color: stat.color }}></i>
            </div>
            <p className="mt-3 text-xl font-bold text-[#1a2332]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}