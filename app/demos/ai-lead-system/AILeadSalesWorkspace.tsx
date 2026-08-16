'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { leads, initialLeadStates, initialTimeline, salesMetrics, tourSteps as aiTourSteps } from './lib/data';
import {
  LeadState,
  LeadStage,
  WorkspaceTab,
  TimelineEvent,
} from './lib/types';

import { productConfigs } from '../components/shared/product-config';
import DemoControlBar from '../components/shared/DemoControlBar';
import DemoEntryOverlay from '../components/shared/DemoEntryOverlay';
import DemoGuidedTour from '../components/shared/DemoGuidedTour';
import DemoEnquiryPanel from '../components/shared/DemoEnquiryPanel';
import DemoCompletionOverlay from '../components/shared/DemoCompletionOverlay';
import DemoEnvironmentNotice from '../components/shared/DemoEnvironmentNotice';
import ExperienceSwitcher from '../components/shared/ExperienceSwitcher';
import ResetConfirmDialog from '../components/shared/ResetConfirmDialog';
import LeadQueue from './components/LeadQueue';
import LeadWorkspace from './components/LeadWorkspace';
import AIIntelligencePanel from './components/AIIntelligencePanel';

const product = productConfigs['ai-lead-system'];

export default function AILeadSalesWorkspace() {
  const [showEntry, setShowEntry] = useState(true);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const [selectedId, setSelectedId] = useState('brighton-electrical');
  const [leadStates, setLeadStates] =
    useState<Record<string, LeadState>>(initialLeadStates);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false };
  }, []);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? leads[0],
    [selectedId],
  );
  const selectedState = leadStates[selectedId];

  const addTimelineEvent = useCallback(
    (label: string, detail: string, type: TimelineEvent['type']) => {
      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setTimeline((prev) => [{ time, label, detail, type }, ...prev.slice(0, 14)]);
    },
    [],
  );

  const addActivity = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setTimeline((prev) => [{ time, label: message, detail: '', type: 'system' }, ...prev.slice(0, 14)]);
  }, []);

  const updateSelected = (patch: Partial<LeadState>) => {
    setLeadStates((current) => ({
      ...current,
      [selectedId]: { ...current[selectedId], ...patch },
    }));
  };

  const handleSelectLead = (id: string) => {
    setSelectedId(id);
    addActivity(`Selected ${leads.find((l) => l.id === id)?.company}.`);
  };

  const handleResearch = () => {
    updateSelected({ stage: 'Researching' });
    addTimelineEvent('Business research completed', `Company and intent research completed for ${selectedLead.company}`, 'ai');
  };

  const handleQualify = () => {
    updateSelected({ qualified: true, stage: 'Qualified' });
    addTimelineEvent('Lead qualified', `Score ${selectedLead.score}/100 - Approved as qualified`, 'milestone');
  };

  const handleNeedsReview = () => {
    addTimelineEvent('Lead marked for review', `${selectedLead.company} needs human review before proceeding`, 'human');
  };

  const handleNotAFit = () => {
    updateSelected({ stage: 'New', qualified: false });
    addTimelineEvent('Lead marked as not a fit', `${selectedLead.company} does not match current services`, 'human');
  };

  const handleGenerateReply = () => {
    updateSelected({ reply: 'draft' });
    addTimelineEvent('Response prepared', 'AI draft response generated for human review', 'ai');
  };

  const handleApproveReply = () => {
    updateSelected({ reply: 'approved', stage: 'Response Ready' });
    addTimelineEvent('Response approved', 'Response approved by Demo User - Ready for proposal', 'human');
  };

  const handleBuildProposal = () => {
    updateSelected({ proposal: 'draft' });
    addTimelineEvent('Proposal prepared', 'Proposal draft built from approved response and lead context', 'ai');
  };

  const handleApproveProposal = () => {
    updateSelected({ proposal: 'approved', stage: 'Proposal' });
    addTimelineEvent('Proposal approved', 'Opportunity created - Handed off to sales team', 'milestone');
    if (tourActive && tourStep === aiTourSteps.length - 1) {
      setTimeout(() => setShowCompletion(true), 600);
    }
  };

  const startTour = () => {
    setShowEntry(false);
    setTourActive(true);
    setTourStep(0);
    setSelectedId('brighton-electrical');
    setActiveTab(aiTourSteps[0].view);
    setLeadStates(initialLeadStates);
    setTimeline(initialTimeline);
    setSessionKey((k) => k + 1);
    addActivity('Guided AI sales experience started.');
  };

  const exploreFreely = () => {
    setShowEntry(false);
    setTourActive(false);
    setTourStep(0);
  };

  const nextTourStep = () => {
    const next = Math.min(tourStep + 1, aiTourSteps.length - 1);
    setTourStep(next);
    setActiveTab(aiTourSteps[next].view);
  };

  const backTourStep = () => {
    const prev = Math.max(tourStep - 1, 0);
    setTourStep(prev);
    setActiveTab(aiTourSteps[prev].view);
  };

  const exitTour = () => {
    setTourActive(false);
    if (tourStep === aiTourSteps.length - 1) {
      setTimeout(() => { if (!mountedRef.current) return; setShowCompletion(true) }, 500);
    }
  };

  const reset = () => {
    setShowEntry(true);
    setTourActive(false);
    setTourStep(0);
    setSelectedId('brighton-electrical');
    setLeadStates(initialLeadStates);
    setTimeline(initialTimeline);
    setActiveTab('overview');
    setShowCompletion(false);
    setShowEnquiry(false);
    setSessionKey((k) => k + 1);
    sessionStorage.removeItem('ais_skip_entry');
  };

  const researched = selectedState.stage !== 'New';
  const qualified = selectedState.qualified;
  const replyApproved = selectedState.reply === 'approved';
  const proposalApproved = selectedState.proposal === 'approved';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060a14] text-white">
      {showEntry && (
        <DemoEntryOverlay
          product={product}
          onStartTour={startTour}
          onExploreFreely={exploreFreely}
          storageKey="ais_skip_entry"
        />
      )}

      <DemoControlBar
        product={product}
        onStartTour={() => { if (!showEntry) startTour() }}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourActive}
        onSwitchExperience={() => setShowSwitcher(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 gap-4 overflow-y-auto p-4 lg:p-5">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row" key={sessionKey}>
                <LeadQueue
                  leads={leads}
                  selectedId={selectedId}
                  states={leadStates}
                  onSelect={handleSelectLead}
                  onActivity={addActivity}
                />

                <LeadWorkspace
                  lead={selectedLead}
                  state={selectedState}
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  timeline={timeline}
                  onResearch={handleResearch}
                  onQualify={handleQualify}
                  onNeedsReview={handleNeedsReview}
                  onNotAFit={handleNotAFit}
                  onGenerateReply={handleGenerateReply}
                  onApproveReply={handleApproveReply}
                  onBuildProposal={handleBuildProposal}
                  onApproveProposal={handleApproveProposal}
                  onActivity={addActivity}
                />

                <AIIntelligencePanel
                  lead={selectedLead}
                  state={selectedState}
                  researched={researched}
                  qualified={qualified}
                  replyApproved={replyApproved}
                  proposalApproved={proposalApproved}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.07] bg-[#0b0f19] px-4 py-3">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
              <DemoEnvironmentNotice product={product} />

              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Leads Processed</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {salesMetrics.leadsProcessed}
                    <span className="ml-1 text-[10px] text-emerald-400">{salesMetrics.leadsProcessedChange}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Response Rate</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {salesMetrics.responseRate}
                    <span className="ml-1 text-[10px] text-emerald-400">{salesMetrics.responseRateChange}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Meetings Booked</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {salesMetrics.meetingsBooked}
                    <span className="ml-1 text-[10px] text-emerald-400">{salesMetrics.meetingsBookedChange}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Pipeline Value</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {salesMetrics.pipelineValueNum}
                    <span className="ml-1 text-[10px] text-emerald-400">{salesMetrics.pipelineValueChange}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Last Sync: 10:18
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <DemoGuidedTour
        product={product}
        active={tourActive}
        step={tourStep}
        total={aiTourSteps.length}
        steps={aiTourSteps}
        onNext={nextTourStep}
        onBack={backTourStep}
        onExit={exitTour}
        onShowMe={() => setActiveTab(aiTourSteps[tourStep].view)}
      />

      <DemoCompletionOverlay
        product={product}
        open={showCompletion}
        onExploreAgain={() => setShowCompletion(false)}
      />

      <DemoEnquiryPanel
        product={product}
        open={showEnquiry}
        onClose={() => setShowEnquiry(false)}
      />

      {showSwitcher && (
        <ExperienceSwitcher currentId={product.id} onClose={() => setShowSwitcher(false)} />
      )}

      <ResetConfirmDialog
        open={showResetConfirm}
        onConfirm={() => { setShowResetConfirm(false); reset() }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}