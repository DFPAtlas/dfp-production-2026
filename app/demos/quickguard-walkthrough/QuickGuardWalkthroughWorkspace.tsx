'use client';

import { useState, useCallback, useRef } from 'react';
import type { Perspective, DemoJob, JobActivity, GuardProfile } from './lib/types';
import { createInitialJob, createInitialActivities, DEMO_GUARD, SECOND_GUARD } from './lib/data';
import { productConfigs } from '../components/shared/product-config';
import DemoControlBar from '../components/shared/DemoControlBar';
import DemoEntryOverlay from '../components/shared/DemoEntryOverlay';
import DemoGuidedTour from '../components/shared/DemoGuidedTour';
import DemoEnquiryPanel from '../components/shared/DemoEnquiryPanel';
import DemoCompletionOverlay from '../components/shared/DemoCompletionOverlay';
import DemoEnvironmentNotice from '../components/shared/DemoEnvironmentNotice';
import ExperienceSwitcher from '../components/shared/ExperienceSwitcher';
import ResetConfirmDialog from '../components/shared/ResetConfirmDialog';
import PerspectiveSwitcher from './components/PerspectiveSwitcher';
import ClientDashboard from './components/ClientDashboard';
import GuardDashboard from './components/GuardDashboard';
import JobWizard from './components/JobWizard';
import MatchingView from './components/MatchingView';
import JobDayActions from './components/JobDayActions';
import CompletionPanel from './components/CompletionPanel';
import PaymentRatingPanel from './components/PaymentRatingPanel';
import LifecycleTimeline from './components/LifecycleTimeline';


export default function QuickGuardWalkthroughWorkspace() {
  const [perspective, setPerspective] = useState<Perspective>('client');
  const [job, setJob] = useState<DemoJob | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [entryDismissed, setEntryDismissed] = useState(false);
  const [entryAction, setEntryAction] = useState<'tour' | 'explore' | 'guard' | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [jobDaySimulated, setJobDaySimulated] = useState(false);
  const [matchingPhase, setMatchingPhase] = useState(0);
  const [activities, setActivities] = useState<JobActivity[]>([]);
  const [guards, setGuards] = useState<GuardProfile[]>([{ ...DEMO_GUARD }, { ...SECOND_GUARD }]);
  const [secondGuardConfirmed, setSecondGuardConfirmed] = useState(false);
  const [guardsCheckedIn, setGuardsCheckedIn] = useState<string[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setJob(null);
    setShowWizard(false);
    setWizardStep(0);
    setEntryDismissed(false);
    setEntryAction(null);
    setTourActive(false);
    setTourStep(0);
    setShowEnquiry(false);
    setShowCompletion(false);
    setShowSwitcher(false);
    setJobDaySimulated(false);
    setMatchingPhase(0);
    setActivities([]);
    setGuards([{ ...DEMO_GUARD }, { ...SECOND_GUARD }]);
    setSecondGuardConfirmed(false);
    setGuardsCheckedIn([]);
    setShowRating(false);
    setRatingSubmitted(false);
    sessionStorage.removeItem('qg_skip_entry');
  }, []);

  const handleEntryAction = useCallback((action: 'tour' | 'explore' | 'guard') => {
    sessionStorage.setItem('qg_skip_entry', '1');
    setEntryDismissed(true);
    setEntryAction(action);
    if (action === 'tour') {
      setTourActive(true);
      setTourStep(0);
    }
    if (action === 'guard') {
      setPerspective('guard');
    }
  }, []);

  const handleStartJob = useCallback(() => {
    const newJob = createInitialJob();
    setJob(newJob);
    setShowWizard(true);
    setWizardStep(0);
  }, []);

  const handleWizardComplete = useCallback((completedJob: DemoJob) => {
    setShowWizard(false);
    setJob({ ...completedJob, status: 'posted' });
    setMatchingPhase(1);

    timerRef.current = setTimeout(() => setMatchingPhase(2), 800);
    timerRef.current = setTimeout(() => setMatchingPhase(3), 1600);
    timerRef.current = setTimeout(() => setMatchingPhase(4), 2400);
    timerRef.current = setTimeout(() => {
      setMatchingPhase(5);
      setActivities(createInitialActivities());
      setJob((prev) => prev ? { ...prev, status: 'matched' } : null);
    }, 3200);
  }, []);

  const handleGuardAccept = useCallback(() => {
    const updatedGuards = guards.map((g) =>
      g.id === DEMO_GUARD.id ? { ...g, accepted: true } : g
    );
    setGuards(updatedGuards);

    const newActivity: JobActivity = {
      id: `act-${Date.now()}`,
      timestamp: '09:44',
      type: 'system',
      message: 'Marcus Reed accepted the job',
      guardId: DEMO_GUARD.id,
    };
    setActivities((prev) => [newActivity, ...prev]);
    setJob((prev) => prev ? { ...prev, status: 'accepted', guards: [updatedGuards[0]] } : null);

    timerRef.current = setTimeout(() => {
      const withSecond = updatedGuards.map((g) =>
        g.id === SECOND_GUARD.id ? { ...g, accepted: true } : g
      );
      setGuards(withSecond);
      setSecondGuardConfirmed(true);
      const secondActivity: JobActivity = {
        id: `act-${Date.now() + 1}`,
        timestamp: '09:46',
        type: 'system',
        message: 'Aisha Khan confirmed — second guard matched',
        guardId: SECOND_GUARD.id,
      };
      setActivities((prev) => [secondActivity, ...prev]);
      setJob((prev) => prev ? { ...prev, status: 'confirmed', guards: [withSecond[0], withSecond[1]] } : null);
    }, 2000);
  }, [guards]);

  const handleSimulateJobDay = useCallback(() => {
    setJobDaySimulated(true);
    setJob((prev) => prev ? { ...prev, status: 'checked_in' } : null);
  }, []);

  const handleCheckIn = useCallback((guardId: string) => {
    setGuardsCheckedIn((prev) => [...prev, guardId]);
    const guardName = guards.find((g) => g.id === guardId)?.name || 'Guard';
    const newActivity: JobActivity = {
      id: `act-checkin-${guardId}`,
      timestamp: '18:02',
      type: 'checkin',
      message: `${guardName} checked in on site`,
      guardId,
    };
    setActivities((prev) => [newActivity, ...prev]);
    if (guardsCheckedIn.length + 1 >= 2) {
      setJob((prev) => prev ? { ...prev, status: 'in_progress' } : null);
    }
  }, [guards, guardsCheckedIn]);

  const handleAddActivity = useCallback((message: string) => {
    const newActivity: JobActivity = {
      id: `act-guard-${Date.now()}`,
      timestamp: '19:15',
      type: 'guard',
      message,
    };
    setActivities((prev) => [newActivity, ...prev]);
  }, []);

  const handleCompleteJob = useCallback(() => {
    setJob((prev) => prev ? { ...prev, status: 'completed' } : null);
    const completeActivity: JobActivity = {
      id: 'act-complete',
      timestamp: '01:05',
      type: 'completion',
      message: 'Shift completed — awaiting client confirmation',
    };
    setActivities((prev) => [completeActivity, ...prev]);
  }, []);

  const handleApproveJob = useCallback(() => {
    setJob((prev) => prev ? { ...prev, status: 'approved' } : null);
    const approveActivity: JobActivity = {
      id: 'act-approve',
      timestamp: '09:15',
      type: 'client',
      message: 'Client confirmed shift completion',
    };
    setActivities((prev) => [approveActivity, ...prev]);
  }, []);

  const handleMarkPaid = useCallback(() => {
    setJob((prev) => prev ? { ...prev, status: 'paid' } : null);
    setShowRating(true);
  }, []);

  const handleSubmitRating = useCallback((rating: number, tags: string[]) => {
    setJob((prev) => prev ? { ...prev, rating, ratingTags: tags } : null);
    setRatingSubmitted(true);
    timerRef.current = setTimeout(() => {
      setShowCompletion(true);
    }, 1200);
  }, []);

  const isReadyForGuardAccept = job?.status === 'matched' && matchingPhase === 5;
  const confirmedGuards = guards.filter((g) => g.accepted);
  const allCheckedIn = jobDaySimulated && guardsCheckedIn.length >= 2;

  const product = productConfigs['quickguard-walkthrough'];

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#080c14] text-white">
      {!entryDismissed && (
        <DemoEntryOverlay
          product={product}
          onStartTour={() => handleEntryAction('tour')}
          onExploreFreely={() => handleEntryAction('explore')}
          extraAction={{ label: 'Start as Guard', icon: 'ri-shield-user-line', action: () => handleEntryAction('guard') }}
          storageKey="qg_skip_entry"
        />
      )}

      <DemoControlBar
        product={product}
        onStartTour={() => { setTourActive(true); setTourStep(0); }}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourActive}
        onSwitchExperience={() => setShowSwitcher(true)}
      />

      <PerspectiveSwitcher
        perspective={perspective}
        onChange={setPerspective}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pb-6 pt-4 lg:px-8">
          {perspective === 'client' ? (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-5">
                {!job && !showWizard && (
                  <ClientDashboard
                    onStartJob={handleStartJob}
                    greeting={entryAction === 'tour' ? 'Good afternoon, James.' : 'Good afternoon, James.'}
                  />
                )}

                {showWizard && (
                  <JobWizard
                    step={wizardStep}
                    onStepChange={setWizardStep}
                    job={job!}
                    onComplete={handleWizardComplete}
                    onCancel={() => { setShowWizard(false); setJob(null); }}
                  />
                )}

                {job && !showWizard && matchingPhase > 0 && matchingPhase < 5 && (
                  <MatchingView phase={matchingPhase} />
                )}

                {job && matchingPhase === 5 && (
                  <MatchingView phase={5} guards={AVAILABLE_GUARDS} job={job} />
                )}

                {job && job.status === 'confirmed' && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                        <i className="ri-shield-check-line text-emerald-400 text-xl"></i>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Your Security Team Is Confirmed</h2>
                        <p className="text-sm text-slate-400">
                          {confirmedGuards.length} of {job.guardsRequired} guards confirmed · {job.date} · {job.timeStart}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 mb-5">
                      {confirmedGuards.map((guard) => (
                        <div key={guard.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
                            {guard.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{guard.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-0.5 text-amber-400">
                                <i className="ri-star-fill text-xs"></i>
                                <span className="text-xs font-medium">{guard.rating}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{guard.completedJobs} jobs</span>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                            Confirmed
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSimulateJobDay}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-play-circle-line text-base"></i>
                        Simulate Job Day
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-message-2-line text-base"></i>
                        Message Team
                      </button>
                    </div>
                  </div>
                )}

                {job && jobDaySimulated && ['checked_in', 'in_progress'].includes(job.status) && (
                  <JobDayActions
                    job={job}
                    guards={guards}
                    guardsCheckedIn={guardsCheckedIn}
                    onCheckIn={handleCheckIn}
                    onAddActivity={handleAddActivity}
                    activities={activities}
                    onCompleteJob={handleCompleteJob}
                    allCheckedIn={allCheckedIn}
                  />
                )}

                {job && ['completed', 'approved'].includes(job.status) && (
                  <CompletionPanel
                    job={job}
                    onApprove={handleApproveJob}
                    onMarkPaid={handleMarkPaid}
                  />
                )}

                {job && showRating && (
                  <PaymentRatingPanel
                    job={job}
                    ratingSubmitted={ratingSubmitted}
                    onSubmitRating={handleSubmitRating}
                  />
                )}

                {job && job.status === 'paid' && !showRating && ratingSubmitted && (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 mx-auto mb-3">
                      <i className="ri-check-double-line text-blue-400 text-2xl"></i>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Marketplace Loop Complete</h2>
                    <p className="text-sm text-slate-400">Payment authorised · Ratings submitted · Job closed</p>
                  </div>
                )}
              </div>

              <div className="w-full shrink-0 lg:w-64">
                <LifecycleTimeline currentStatus={job?.status || null} />
                {activities.length > 0 && (
                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Activity Log
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {activities.map((act) => (
                        <div key={act.id} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-[10px] text-slate-600">{act.timestamp}</span>
                          <span className="text-[11px] text-slate-400">{act.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-5">
                <GuardDashboard
                  guard={guards[0]}
                  job={job}
                  isReadyForAccept={isReadyForGuardAccept || false}
                  onAccept={handleGuardAccept}
                  jobDaySimulated={jobDaySimulated}
                  guardsCheckedIn={guardsCheckedIn}
                  onCheckIn={handleCheckIn}
                  onAddActivity={handleAddActivity}
                  activities={activities}
                  onCompleteJob={handleCompleteJob}
                  jobStatus={job?.status || null}
                  secondGuardConfirmed={secondGuardConfirmed}
                  allCheckedIn={allCheckedIn}
                />
              </div>

              <div className="w-full shrink-0 lg:w-64">
                <LifecycleTimeline currentStatus={job?.status || null} />
                {activities.length > 0 && (
                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Activity Log
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {activities.map((act) => (
                        <div key={act.id} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-[10px] text-slate-600">{act.timestamp}</span>
                          <span className="text-[11px] text-slate-400">{act.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DemoGuidedTour
        product={product}
        active={tourActive}
        step={tourStep}
        total={product.tourSteps.length}
        steps={product.tourSteps}
        onNext={() => setTourStep((s) => Math.min(s + 1, product.tourSteps.length - 1))}
        onBack={() => setTourStep((s) => Math.max(s - 1, 0))}
        onExit={() => { setTourActive(false); setTourStep(0); }}
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
        onConfirm={() => { setShowResetConfirm(false); resetAll(); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}

const AVAILABLE_GUARDS = [
  { ...DEMO_GUARD },
  { ...SECOND_GUARD },
  {
    id: 'guard-daniel',
    name: 'Daniel Price',
    role: 'Door Supervisor',
    rating: 4.9,
    completedJobs: 156,
    distance: 5.6,
    verified: true,
    initials: 'DP',
    accepted: false,
    checkedIn: false,
  },
  {
    id: 'guard-sophie',
    name: 'Sophie Laurent',
    role: 'Security Officer',
    rating: 4.7,
    completedJobs: 93,
    distance: 3.4,
    verified: true,
    initials: 'SL',
    accepted: false,
    checkedIn: false,
  },
  {
    id: 'guard-james-c',
    name: 'James Carter',
    role: 'Door Supervisor',
    rating: 4.6,
    completedJobs: 71,
    distance: 6.2,
    verified: true,
    initials: 'JC',
    accepted: false,
    checkedIn: false,
  },
  {
    id: 'guard-elena',
    name: 'Elena Vasquez',
    role: 'Event Security',
    rating: 4.8,
    completedJobs: 108,
    distance: 3.0,
    verified: true,
    initials: 'EV',
    accepted: false,
    checkedIn: false,
  },
];