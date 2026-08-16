'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Lead,
  LeadState,
  LeadStage,
  WorkspaceTab,
  TimelineEvent,
} from '../lib/types';
import {
  qualificationFactors,
  researchItems,
  aiDraftEmail,
  aiDraftSubject,
  proposalModules,
  proposalScope,
} from '../lib/data';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  Mail,
  Send,
  FileCheck2,
  ChevronRight,
  Edit3,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';

interface LeadWorkspaceProps {
  lead: Lead;
  state: LeadState;
  activeTab: WorkspaceTab;
  onChangeTab: (tab: WorkspaceTab) => void;
  timeline: TimelineEvent[];
  onResearch: () => void;
  onQualify: () => void;
  onNeedsReview: () => void;
  onNotAFit: () => void;
  onGenerateReply: () => void;
  onApproveReply: () => void;
  onBuildProposal: () => void;
  onApproveProposal: () => void;
  onActivity: (message: string) => void;
}

const tabs: { key: WorkspaceTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'research', label: 'Research' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'conversation', label: 'Conversation' },
  { key: 'proposal', label: 'Proposal' },
];

const stageOrder: LeadStage[] = [
  'New',
  'Researching',
  'Qualified',
  'Response Ready',
  'Proposal',
  'Won',
];

function StageIndicator({ stage }: { stage: LeadStage }) {
  const idx = stageOrder.indexOf(stage);
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {stageOrder.map((s, i) => {
        const completed = i <= idx;
        const isCurrent = i === idx;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  completed
                    ? isCurrent
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                      : 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-600'
                }`}
              >
                {completed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[9px]">{i + 1}</span>
                )}
              </div>
              <span
                className={`mt-1 text-[9px] font-medium ${
                  isCurrent
                    ? 'text-cyan-400'
                    : completed
                      ? 'text-emerald-400'
                      : 'text-slate-600'
                }`}
              >
                {s}
              </span>
            </div>
            {i < stageOrder.length - 1 && (
              <div
                className={`mb-4 h-px w-6 ${
                  i < idx ? 'bg-emerald-400/30' : 'bg-white/[0.06]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FitBadge({ fit }: { fit: Lead['fit'] }) {
  const classes =
    fit === 'High'
      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
      : fit === 'Medium'
        ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
        : 'bg-red-400/10 text-red-400 border-red-400/20';
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${classes}`}
    >
      {fit} Fit
    </span>
  );
}

function StatusBadge({ stage }: { stage: LeadStage }) {
  const colors: Record<LeadStage, string> = {
    New: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    Researching: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
    Qualified: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    'Response Ready': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    Proposal: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
    Won: 'bg-emerald-300/10 text-emerald-300 border-emerald-300/20',
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[stage]}`}
    >
      {stage}
    </span>
  );
}

export default function LeadWorkspace({
  lead,
  state,
  activeTab,
  onChangeTab,
  timeline,
  onResearch,
  onQualify,
  onNeedsReview,
  onNotAFit,
  onGenerateReply,
  onApproveReply,
  onBuildProposal,
  onApproveProposal,
  onActivity,
}: LeadWorkspaceProps) {
  const [researching, setResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchDone, setResearchDone] = useState(false);

  const onResearchRef = useRef(onResearch);
  const onActivityRef = useRef(onActivity);
  onResearchRef.current = onResearch;
  onActivityRef.current = onActivity;

  useEffect(() => {
    if (!researching) return;
    const steps = [20, 45, 70, 90, 100];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setResearchProgress(steps[i]);
        i++;
      } else {
        clearInterval(interval);
        setResearching(false);
        setResearchDone(true);
        onResearchRef.current();
        onActivityRef.current(`Completed AI research on ${lead.company}.`);
      }
    }, 280);
    return () => clearInterval(interval);
  }, [researching, lead]);

  const startResearch = () => {
    setResearching(true);
    setResearchProgress(0);
    setResearchDone(false);
    onActivity(`Started AI research on ${lead.company}.`);
  };

  const handleTabChange = (tab: WorkspaceTab) => {
    onChangeTab(tab);
    onActivity(`Switched to ${tab} tab for ${lead.company}.`);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] text-lg font-bold text-white">
              {lead.initials}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {lead.company}
              </h2>
              <p className="text-xs text-slate-500">
                {lead.sector} &middot; {lead.location} &middot; {lead.employees}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <FitBadge fit={lead.fit} />
              <StatusBadge stage={state.stage} />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Owner: James Sales
            </div>
          </div>
        </div>

        <StageIndicator stage={state.stage} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`rounded-t-lg px-3 py-2 text-xs font-medium transition ${
              activeTab === t.key
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewContent
            lead={lead}
            state={state}
            timeline={timeline}
            onResearch={startResearch}
            onGenerateReply={onGenerateReply}
            onApproveReply={onApproveReply}
            onBuildProposal={onBuildProposal}
            onActivity={onActivity}
          />
        )}
        {activeTab === 'research' && (
          <ResearchContent
            lead={lead}
            researched={researchDone || state.stage !== 'New'}
            researching={researching}
            progress={researchProgress}
            onResearch={startResearch}
            onActivity={onActivity}
          />
        )}
        {activeTab === 'qualification' && (
          <QualificationContent
            lead={lead}
            state={state}
            onQualify={onQualify}
            onNeedsReview={onNeedsReview}
            onNotAFit={onNotAFit}
            onActivity={onActivity}
          />
        )}
        {activeTab === 'conversation' && (
          <ConversationContent
            lead={lead}
            state={state}
            onGenerateReply={onGenerateReply}
            onApproveReply={onApproveReply}
            onActivity={onActivity}
          />
        )}
        {activeTab === 'proposal' && (
          <ProposalContent
            lead={lead}
            state={state}
            onBuildProposal={onBuildProposal}
            onApproveProposal={onApproveProposal}
            onActivity={onActivity}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Overview Tab ─── */

function OverviewContent({
  lead,
  state,
  timeline,
  onResearch,
  onGenerateReply,
  onApproveReply,
  onBuildProposal,
  onActivity,
}: {
  lead: Lead;
  state: LeadState;
  timeline: TimelineEvent[];
  onResearch: () => void;
  onGenerateReply: () => void;
  onApproveReply: () => void;
  onBuildProposal: () => void;
  onActivity: (m: string) => void;
}) {
  const researched = state.stage !== 'New';
  const qualified = state.qualified;
  const replyReady = state.reply !== 'locked';
  const replyApproved = state.reply === 'approved';
  const proposalReady = state.proposal !== 'locked';
  const proposalApproved = state.proposal === 'approved';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Incoming Enquiry */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-cyan-400" />
            <p className="text-xs font-semibold text-white">Incoming Enquiry</p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {lead.source} &middot; Just now
          </p>
          <div className="mt-3 space-y-2 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Source</span>
              <span>{lead.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Enquiry Type</span>
              <span>{lead.enquiryType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Inquiry</span>
              <span>{lead.serviceInquiry}</span>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <p className="text-[11px] leading-4 text-slate-400">
              {lead.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onActivity('Viewed full enquiry details.')}
            className="mt-2 text-[11px] text-cyan-400 transition hover:text-cyan-300"
          >
            View Full Enquiry
          </button>
        </div>

        {/* Research Summary */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <p className="text-xs font-semibold text-white">Research Summary</p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            AI Research &middot; {researched ? 'Completed' : 'Pending'}
          </p>
          {researched ? (
            <div className="mt-3 space-y-2 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-500">Company</span>
                <span>{lead.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Size</span>
                <span>{lead.employees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Revenue Range</span>
                <span>{lead.estValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Headquarters</span>
                <span>{lead.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Key Services</span>
                <span className="text-right">Electrical Install, Maintenance</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-xs text-slate-500">
                Research not started yet.
              </p>
              <button
                type="button"
                onClick={onResearch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-1.5 text-[11px] font-medium text-cyan-400 transition hover:bg-cyan-500/25"
              >
                <Sparkles className="h-3 w-3" />
                Research Business
              </button>
            </div>
          )}
          {researched && (
            <button
              type="button"
              onClick={() => onActivity('Viewed full research report.')}
              className="mt-2 text-[11px] text-cyan-400 transition hover:text-cyan-300"
            >
              View Full Research
            </button>
          )}
        </div>

        {/* Qualification Score */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-semibold text-white">
              Qualification Score
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {qualified ? 'Qualified' : 'Pending'}
          </p>
          {qualified ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="5"
                    strokeDasharray={`${(lead.score / 100) * 175.9} 175.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-emerald-400">
                  {lead.score}
                </span>
              </div>
              <div className="flex-1 space-y-1.5">
                {qualificationFactors.map((factor) => (
                  <div key={factor.label} className="flex items-center gap-2">
                    <span className="w-14 text-[10px] text-slate-500">
                      {factor.label}
                    </span>
                    <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
                      <div
                        className="h-1.5 rounded-full bg-emerald-400"
                        style={{
                          width: `${(factor.score / factor.max) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-6 text-[10px] text-slate-400">
                      {factor.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-xs text-slate-500">
                Qualification not completed.
              </p>
              <p className="text-[10px] text-slate-600">
                Complete research first.
              </p>
            </div>
          )}
        </div>

        {/* AI Draft Response */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-semibold text-white">AI Draft Response</p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {replyApproved
              ? 'Approved'
              : replyReady
                ? 'Draft Ready'
                : qualified
                  ? 'Ready to Generate'
                  : 'Locked'}
          </p>
          {replyApproved || replyReady ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-slate-500">
                Subject: {aiDraftSubject(lead)}
              </p>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <p className="text-[11px] leading-4 text-slate-400 line-clamp-6">
                  {aiDraftEmail(lead).split('\n')[0]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!replyApproved && (
                  <button
                    type="button"
                    onClick={onApproveReply}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-400/25"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Approve
                  </button>
                )}
                {replyApproved && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                    <Check className="h-3 w-3" /> Approved
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onActivity('Opened draft editor.')}
                  className="text-[10px] text-slate-500 transition hover:text-slate-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onActivity('Requested draft regeneration.')}
                  className="text-[10px] text-slate-500 transition hover:text-slate-300"
                >
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-xs text-slate-500">
                {qualified
                  ? 'Generate a draft response.'
                  : 'Complete qualification first.'}
              </p>
              {qualified && (
                <button
                  type="button"
                  onClick={onGenerateReply}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-400/15 px-3 py-1.5 text-[11px] font-medium text-blue-400 transition hover:bg-blue-400/25"
                >
                  <Sparkles className="h-3 w-3" />
                  Prepare Response
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Timeline */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs font-semibold text-white">Conversation Timeline</p>
        <div className="mt-3 space-y-3">
          {timeline.slice(0, 6).map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  event.type === 'ai'
                    ? 'bg-violet-400/10 text-violet-400'
                    : event.type === 'human'
                      ? 'bg-cyan-400/10 text-cyan-400'
                      : event.type === 'milestone'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-white/[0.06] text-slate-500'
                }`}
              >
                {event.type === 'ai' ? (
                  <Sparkles className="h-3 w-3" />
                ) : event.type === 'human' ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : event.type === 'milestone' ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium text-white">
                  {event.label}
                </p>
                <p className="text-[10px] text-slate-500">{event.detail}</p>
                <p className="text-[10px] text-slate-600">{event.time}</p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-xs text-slate-500">No events yet.</p>
          )}
        </div>
      </div>

      {/* Next Best Action */}
      <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-cyan-400" />
          <p className="text-xs font-semibold text-white">Next Best Action</p>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          {!researched
            ? 'Start AI research to understand the business context and services.'
            : !qualified
              ? 'Review qualification score and approve or reject this opportunity.'
              : !replyReady
                ? 'Generate an AI draft response for human review and approval.'
                : !replyApproved
                  ? 'Review and approve the AI draft before moving to proposal.'
                  : !proposalReady
                    ? 'Build a proposal from the approved response and lead context.'
                    : !proposalApproved
                      ? 'Review and approve the proposal draft for the sales team.'
                      : 'Opportunity is ready. Hand off to the sales team for closing.'}
        </p>
        <div className="mt-3">
          {!researched ? (
            <button
              type="button"
              onClick={onResearch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Sparkles className="h-3 w-3" />
              Research Business
            </button>
          ) : !qualified ? (
            <button
              type="button"
              onClick={() => onActivity('Opened qualification workspace.')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <ShieldCheck className="h-3 w-3" />
              Qualify Lead
            </button>
          ) : !replyReady ? (
            <button
              type="button"
              onClick={onGenerateReply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-blue-300"
            >
              <Mail className="h-3 w-3" />
              Prepare Response
            </button>
          ) : !replyApproved ? (
            <button
              type="button"
              onClick={onApproveReply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <ThumbsUp className="h-3 w-3" />
              Approve Response
            </button>
          ) : !proposalReady ? (
            <button
              type="button"
              onClick={onBuildProposal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-violet-300"
            >
              <FileCheck2 className="h-3 w-3" />
              Build Proposal
            </button>
          ) : !proposalApproved ? (
            <button
              type="button"
              onClick={onApproveProposal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <ThumbsUp className="h-3 w-3" />
              Approve Proposal
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <Check className="h-3 w-3" />
              Opportunity Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Research Tab ─── */

function ResearchContent({
  lead,
  researched,
  researching,
  progress,
  onResearch,
  onActivity,
}: {
  lead: Lead;
  researched: boolean;
  researching: boolean;
  progress: number;
  onResearch: () => void;
  onActivity: (m: string) => void;
}) {
  const steps = [
    'Reading company details...',
    'Identifying services...',
    'Understanding likely customer type...',
    'Checking enquiry context...',
    'Preparing summary...',
  ];

  const currentStep = Math.min(
    Math.floor((progress / 100) * steps.length),
    steps.length - 1,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">AI Research</h3>
            <p className="text-[10px] text-slate-500">
              Simulated Research &middot; No external lookup
            </p>
          </div>
          {!researched && !researching && (
            <button
              type="button"
              onClick={onResearch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Research Business
            </button>
          )}
          {researching && (
            <span className="text-xs text-cyan-400">
              Researching... {progress}%
            </span>
          )}
          {researched && !researching && (
            <button
              type="button"
              onClick={onResearch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Run Again
            </button>
          )}
        </div>

        {researching && (
          <div className="mt-5 space-y-3">
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div
                className="h-1.5 rounded-full bg-cyan-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] ${
                      i <= currentStep
                        ? 'bg-cyan-400/15 text-cyan-400'
                        : 'bg-white/[0.04] text-slate-600'
                    }`}
                  >
                    {i < currentStep ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`text-xs ${
                      i <= currentStep ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {researched && !researching && (
          <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-300">
                Business Snapshot
              </p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {researchItems(lead).map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
                >
                  <p className="text-[10px] text-slate-500">{item.label}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-300">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[10px] text-slate-500">Opportunity</span>
              <span className="text-[11px] font-semibold text-emerald-400">
                High
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Qualification Tab ─── */

function QualificationContent({
  lead,
  state,
  onQualify,
  onNeedsReview,
  onNotAFit,
  onActivity,
}: {
  lead: Lead;
  state: LeadState;
  onQualify: () => void;
  onNeedsReview: () => void;
  onNotAFit: () => void;
  onActivity: (m: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Qualification
            </h3>
            <p className="text-[10px] text-slate-500">
              Demo qualification indicators
            </p>
          </div>
          {state.qualified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-400">
              <Check className="h-3 w-3" />
              Qualified
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-6">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#34d399"
                strokeWidth="7"
                strokeDasharray={`${(lead.score / 100) * 263.9} 263.9`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-emerald-400">
                {lead.score}
              </span>
              <p className="text-[10px] text-slate-500">/ 100</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {lead.score >= 80
                ? 'Strong Opportunity'
                : lead.score >= 60
                  ? 'Moderate Opportunity'
                  : 'Weak Opportunity'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Based on simulated enquiry data
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {qualificationFactors.map((factor) => (
            <div key={factor.label} className="flex items-center gap-3">
              <span className="w-20 text-[11px] text-slate-400">
                {factor.label}
              </span>
              <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: `${(factor.score / factor.max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-[11px] font-semibold text-white">
                {factor.score}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Why this scored highly
          </p>
          <ul className="mt-2 space-y-1.5">
            {[
              'Clear business problem described',
              'Existing demand indicated',
              'Operational impact mentioned',
              'Asked about implementation',
            ].map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-[11px] text-slate-400"
              >
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-medium text-amber-300">
                Human decision required
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                AI prepares. Your team approves. This lead looks promising, but
                the final decision is yours.
              </p>
            </div>
          </div>
        </div>

        {!state.qualified && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onQualify();
                onActivity(`Approved ${lead.company} as qualified.`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Approve as Qualified
            </button>
            <button
              type="button"
              onClick={() => {
                onNeedsReview();
                onActivity(`Marked ${lead.company} for review.`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-xs font-medium text-amber-400 transition hover:bg-amber-400/15"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Needs Review
            </button>
            <button
              type="button"
              onClick={() => {
                onNotAFit();
                onActivity(`Marked ${lead.company} as not a fit.`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08]"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Not a Fit
            </button>
          </div>
        )}

        {state.qualified && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
            <Check className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-emerald-300">
                Lead approved as qualified
              </p>
              <p className="text-[10px] text-emerald-400/60">
                Moved to Qualified stage
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Conversation Tab ─── */

function ConversationContent({
  lead,
  state,
  onGenerateReply,
  onApproveReply,
  onActivity,
}: {
  lead: Lead;
  state: LeadState;
  onGenerateReply: () => void;
  onApproveReply: () => void;
  onActivity: (m: string) => void;
}) {
  const draft = aiDraftEmail(lead);
  const subject = aiDraftSubject(lead);
  const unlocked = state.qualified;
  const hasDraft = state.reply !== 'locked';
  const approved = state.reply === 'approved';

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs font-semibold text-white">
          Conversation Timeline
        </p>
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-slate-500">
              <Clock className="h-3 w-3" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white">
                Enquiry received
              </p>
              <p className="text-[10px] text-slate-500">
                Website contact form submission
              </p>
            </div>
          </div>
          {state.stage !== 'New' && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-violet-400">
                <Sparkles className="h-3 w-3" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white">
                  Research completed
                </p>
                <p className="text-[10px] text-slate-500">
                  Company and intent research completed
                </p>
              </div>
            </div>
          )}
          {state.qualified && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                <Check className="h-3 w-3" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white">
                  Lead qualified
                </p>
                <p className="text-[10px] text-slate-500">
                  Score {lead.score}/100 &middot; Approved as qualified
                </p>
              </div>
            </div>
          )}
          {hasDraft && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400/10 text-blue-400">
                <Mail className="h-3 w-3" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white">
                  Response prepared
                </p>
                <p className="text-[10px] text-slate-500">
                  AI draft response generated
                </p>
              </div>
            </div>
          )}
          {approved && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">
                <ShieldCheck className="h-3 w-3" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white">
                  Response approved by Demo User
                </p>
                <p className="text-[10px] text-slate-500">
                  Ready to move to proposal
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Draft Editor */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-semibold text-white">AI Draft</p>
          </div>
          {!unlocked && (
            <span className="text-[10px] text-slate-600">
              Complete qualification first
            </span>
          )}
        </div>

        {!hasDraft ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <Mail className="h-8 w-8 text-slate-700" />
            <p className="text-xs text-slate-500">
              {unlocked
                ? 'Generate an AI draft response.'
                : 'Qualification required to unlock.'}
            </p>
            {unlocked && (
              <button
                type="button"
                onClick={onGenerateReply}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-blue-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Prepare Response
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-white/[0.06] bg-[#0a0f1c] p-3">
              <div className="border-b border-white/[0.06] pb-2">
                <p className="text-[10px] text-slate-500">To</p>
                <p className="text-[11px] text-slate-300">
                  {lead.contact} &lt;{lead.email}&gt;
                </p>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-slate-500">Subject</p>
                <p className="text-[11px] font-medium text-slate-300">
                  {subject}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-[#0a0f1c] p-4">
              {draft.split('\n').map((line, i) => (
                <p
                  key={i}
                  className="text-[12px] leading-5 text-slate-400"
                >
                  {line || '\u00a0'}
                </p>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!approved && (
                <button
                  type="button"
                  onClick={onApproveReply}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  <ThumbsUp className="h-3 w-3" />
                  Approve Response
                </button>
              )}
              {approved && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <Check className="h-3 w-3" />
                  Response approved
                </span>
              )}
              <button
                type="button"
                onClick={() => onActivity('Opened draft editor.')}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/[0.08]"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onActivity('Requested draft regeneration.')}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/[0.08]"
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
            <p className="text-[10px] text-slate-600">
              Demo only &mdash; approval will simulate sending.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Proposal Tab ─── */

function ProposalContent({
  lead,
  state,
  onBuildProposal,
  onApproveProposal,
  onActivity,
}: {
  lead: Lead;
  state: LeadState;
  onBuildProposal: () => void;
  onApproveProposal: () => void;
  onActivity: (m: string) => void;
}) {
  const unlocked = state.reply === 'approved';
  const hasProposal = state.proposal !== 'locked';
  const approved = state.proposal === 'approved';

  return (
    <div className="space-y-4">
      {!unlocked && !hasProposal && (
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-medium text-amber-300">
                Response approval required
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                Approve the AI draft response before building a proposal.
              </p>
            </div>
          </div>
        </div>
      )}

      {approved && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] p-5 text-center">
          <p className="text-sm font-semibold text-emerald-300">
            Opportunity Created
          </p>
          <p className="mt-1 text-xs text-emerald-400/60">
            Potential solution: AI Lead Management System
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {proposalModules.map((mod) => (
              <span
                key={mod}
                className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300"
              >
                {mod}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-violet-400" />
            <p className="text-xs font-semibold text-white">
              {approved ? 'Approved Proposal' : 'Proposal Draft'}
            </p>
          </div>
          {!hasProposal && unlocked && (
            <button
              type="button"
              onClick={onBuildProposal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-violet-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Prepare Proposal
            </button>
          )}
        </div>

        {!hasProposal ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <FileCheck2 className="h-8 w-8 text-slate-700" />
            <p className="text-xs text-slate-500">
              {unlocked
                ? 'Build a proposal from the approved response.'
                : 'Complete response approval first.'}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  Digital Footprint Proposal
                </p>
                <h4 className="mt-1 text-lg font-semibold text-white">
                  {lead.company}
                </h4>
                <p className="text-xs text-slate-500">{lead.requirement}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">
                  Indicative investment
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {lead.budget}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {proposalScope.map((item, i) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onActivity(`Reviewed proposal item: ${item}.`)}
                  className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-left"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-400/10 text-[9px] font-bold text-violet-400">
                    {i + 1}
                  </span>
                  <span className="text-[11px] text-slate-300">{item}</span>
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-violet-400/15 bg-violet-400/[0.05] p-3">
              <p className="text-xs font-medium text-white">
                Recommended next step
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                A 60-minute discovery workshop to confirm workflows, integrations,
                priorities and final delivery pricing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!approved && (
                <button
                  type="button"
                  onClick={onApproveProposal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Approve Proposal Draft
                </button>
              )}
              {approved && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Proposal approved
                </span>
              )}
              <button
                type="button"
                onClick={() => onActivity('Opened proposal editor.')}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-400 transition hover:bg-white/[0.08]"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </button>
            </div>
            <p className="text-[10px] text-slate-600">
              This is simulated. No real proposal is sent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}