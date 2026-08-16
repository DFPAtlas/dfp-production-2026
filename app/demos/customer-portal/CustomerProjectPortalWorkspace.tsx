'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ViewKey,
  ApprovalDecision,
  PortalFile,
  PortalMessage,
  Invoice,
  ActivityEvent,
} from './lib/types';
import {
  milestones,
  initialFiles,
  initialMessages,
  initialInvoices,
  initialActivity,
  teamMembers,
  tourSteps,
  initialNotifications,
} from './lib/data';
import { productConfigs } from '../components/shared/product-config';
import DemoControlBar from '../components/shared/DemoControlBar';
import DemoEntryOverlay from '../components/shared/DemoEntryOverlay';
import DemoGuidedTour from '../components/shared/DemoGuidedTour';
import DemoEnquiryPanel from '../components/shared/DemoEnquiryPanel';
import DemoCompletionOverlay from '../components/shared/DemoCompletionOverlay';
import DemoEnvironmentNotice from '../components/shared/DemoEnvironmentNotice';
import ExperienceSwitcher from '../components/shared/ExperienceSwitcher';
import ResetConfirmDialog from '../components/shared/ResetConfirmDialog';
import PortalHeader from './components/PortalHeader';
import SidebarNav from './components/SidebarNav';
import OverviewView from './components/OverviewView';
import MilestonesView from './components/MilestonesView';
import ApprovalsView from './components/ApprovalsView';
import MessagesView from './components/MessagesView';
import FilesView from './components/FilesView';
import BillingView from './components/BillingView';

const product = productConfigs['customer-portal'];

export default function CustomerProjectPortalWorkspace() {
  const [view, setView] = useState<ViewKey>('overview');
  const [decision, setDecision] = useState<ApprovalDecision>('pending');
  const [files, setFiles] = useState<PortalFile[]>(initialFiles);
  const [messages, setMessages] = useState<PortalMessage[]>(initialMessages);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity);
  const [notifications] = useState(initialNotifications);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false };
  }, []);

  const progress = decision === 'approved' ? 84 : 78;
  const nextMilestone = decision === 'approved' ? 'Final launch review' : 'Final Dashboard Approval';

  const addActivity = useCallback((label: string) => {
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    const evt: ActivityEvent = { id: `a-${Date.now()}`, time: timeStr, label, detail: label, type: 'system' };
    setActivity((prev) => [evt, ...prev]);
  }, []);

  const selectView = useCallback((next: ViewKey) => {
    setView(next);
    addActivity(`Opened ${next} section.`);
  }, [addActivity]);

  const startTour = useCallback(() => {
    setTourActive(true);
    setTourStep(0);
    setView(tourSteps[0].view);
    addActivity('Guided portal tour started.');
  }, [addActivity]);

  const nextTourStep = useCallback(() => {
    const next = Math.min(tourStep + 1, tourSteps.length - 1);
    setTourStep(next);
    setView(tourSteps[next].view);
    addActivity(`Tour moved to step ${next + 1}: ${tourSteps[next].title}.`);
  }, [tourStep, addActivity]);

  const backTourStep = useCallback(() => {
    const prev = Math.max(tourStep - 1, 0);
    setTourStep(prev);
    setView(tourSteps[prev].view);
    addActivity(`Tour moved back to step ${prev + 1}.`);
  }, [tourStep, addActivity]);

  const exitTour = useCallback(() => {
    setTourActive(false);
    if (tourStep === tourSteps.length - 1) {
      setTimeout(() => { if (!mountedRef.current) return; setShowCompletion(true) }, 500);
    }
  }, [tourStep]);

  const reset = useCallback(() => {
    setView('overview');
    setDecision('pending');
    setFiles(initialFiles);
    setMessages(initialMessages);
    setInvoices(initialInvoices);
    setActivity(initialActivity);
    setTourActive(false);
    setTourStep(0);
    setShowCompletion(false);
    setShowEnquiry(false);
    addActivity('Demo reset to starting state.');
  }, [addActivity]);

  const handleDecision = useCallback((d: ApprovalDecision) => {
    setDecision(d);
    if (d === 'approved') {
      addActivity('Dashboard prototype approved by Daniel.');
      const approvalEvt: ActivityEvent = {
        id: `a-${Date.now()}`,
        time: 'Just now',
        label: 'Dashboard prototype approved by Daniel',
        detail: 'Design approval received. Project advancing to launch phase.',
        type: 'approval',
      };
      setActivity((prev) => [approvalEvt, ...prev]);
    }
  }, [addActivity]);

  const handleMessagePM = useCallback(() => {
    setView('messages');
    addActivity('Opened messages to contact project manager.');
  }, [addActivity]);

  const activityTime = useMemo(() => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), [activity]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f5f2]">
      <DemoEntryOverlay
        product={product}
        onStartTour={startTour}
        onExploreFreely={() => {}}
        storageKey="cpp_skip_entry"
      />

      <DemoControlBar
        product={product}
        onStartTour={startTour}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourActive}
        onSwitchExperience={() => setShowSwitcher(true)}
      />

      <PortalHeader
        progress={progress}
        decision={decision}
        nextMilestone={nextMilestone}
        notifications={notifications}
        onMessagePM={handleMessagePM}
      />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <SidebarNav
          activeView={view}
          onSelect={selectView}
          progress={progress}
          nextApproval={nextMilestone}
          decision={decision}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            {view === 'overview' && (
              <OverviewView
                progress={progress}
                decision={decision}
                onNavigate={selectView}
                activity={activity}
                messages={messages}
                files={files}
                invoices={invoices}
                onActivity={addActivity}
                onMessagePM={handleMessagePM}
              />
            )}
            {view === 'milestones' && (
              <MilestonesView milestones={milestones} decision={decision} onActivity={addActivity} />
            )}
            {view === 'approvals' && (
              <ApprovalsView decision={decision} onDecision={handleDecision} onActivity={addActivity} />
            )}
            {view === 'messages' && (
              <MessagesView messages={messages} onMessagesChange={setMessages} onActivity={addActivity} team={teamMembers} />
            )}
            {view === 'files' && (
              <FilesView files={files} onFilesChange={setFiles} onActivity={addActivity} />
            )}
            {view === 'billing' && (
              <BillingView invoices={invoices} onInvoicesChange={setInvoices} onActivity={addActivity} />
            )}
          </div>
        </main>
      </div>

      <div className="flex items-center justify-between border-t border-[#e8e5df] bg-white px-4 py-2.5">
        <DemoEnvironmentNotice product={product} />
        <span className="text-[10px] text-[#8a8a8a]">
          Latest: {activity[0]?.label ?? 'Portal loaded'} · {activityTime}
        </span>
      </div>

      <DemoGuidedTour
        product={product}
        active={tourActive}
        step={tourStep}
        total={tourSteps.length}
        steps={tourSteps}
        onNext={nextTourStep}
        onBack={backTourStep}
        onExit={exitTour}
        onShowMe={() => setView(tourSteps[tourStep].view)}
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