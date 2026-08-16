'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import type { ViewKey, DemoSite, DemoIncident, RotaShift, ActivityEvent, IntelligenceInsight, ClientReport } from './lib/types';
import {
  SITES,
  GUARDS,
  INCIDENT,
  ROTA_SHIFTS,
  COMPLIANCE_RECORDS,
  INITIAL_ACTIVITIES,
  INITIAL_INSIGHTS,
  CLIENT_REPORTS,
  TOUR_STEPS,
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
import Sidebar from './components/Sidebar';
import CommandCentreView from './components/CommandCentreView';
import SiteDetailPanel from './components/SiteDetailPanel';
import GuardProfilePanel from './components/GuardProfilePanel';
import PatrolView from './components/PatrolView';
import IncidentPanel from './components/IncidentPanel';
import RotaView from './components/RotaView';
import ComplianceView from './components/ComplianceView';
import ClientView from './components/ClientView';
import LiveOperationsRail from './components/LiveOperationsRail';
import IntelligencePanel from './components/IntelligencePanel';

const product = productConfigs['guardianhub-preview'];

export default function GuardianHubWorkspace() {
  const [view, setView] = useState<ViewKey>('command');
  const [entryDismissed, setEntryDismissed] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sites, setSites] = useState<DemoSite[]>(() => SITES.map((s) => ({ ...s, patrolCheckpoints: s.patrolCheckpoints.map((c) => ({ ...c })) })));
  const [incident, setIncident] = useState<DemoIncident>(() => ({ ...INCIDENT, timeline: INCIDENT.timeline.map((t) => ({ ...t })) }));
  const [rotaShifts, setRotaShifts] = useState<RotaShift[]>(() => ROTA_SHIFTS.map((s) => ({ ...s, assignedGuards: [...s.assignedGuards] })));
  const [activities, setActivities] = useState<ActivityEvent[]>(() => INITIAL_ACTIVITIES.map((a) => ({ ...a })));
  const [insights, setInsights] = useState<IntelligenceInsight[]>(() => INITIAL_INSIGHTS.map((i) => ({ ...i })));
  const [clientReports, setClientReports] = useState<ClientReport[]>(() => CLIENT_REPORTS.map((r) => ({ ...r })));
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const guardsOnDuty = useMemo(() => GUARDS.filter((g) => g.status === 'on_duty').length, []);
  const totalGuards = GUARDS.length;
  const openIncidents = useMemo(() => incident.status !== 'resolved' ? 1 : 0, [incident.status]);
  const compliancePct = useMemo(() => {
    const total = COMPLIANCE_RECORDS.length;
    const current = COMPLIANCE_RECORDS.filter((r) => r.status === 'current').length;
    return Math.round((current / total) * 100);
  }, []);

  const addActivity = useCallback((message: string, type: ActivityEvent['type'] = 'system', extra?: { siteId?: string; guardId?: string }) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setActivities((prev) => [{ id: `act-${Date.now()}`, time, message, type, ...extra }, ...prev.slice(0, 11)]);
  }, []);

  const handleEntryAction = useCallback((action: 'tour' | 'explore') => {
    sessionStorage.setItem('gh_skip_entry', '1');
    setEntryDismissed(true);
    if (action === 'tour') {
      setTourActive(true);
      setTourStep(0);
      setView(TOUR_STEPS[0].view);
    }
  }, []);

  const handleNavigate = (next: ViewKey) => {
    setView(next);
    setSelectedSiteId(null);
    setSelectedGuardId(null);
  };

  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId);
    setView('sites');
  };

  const handleSelectGuard = (guardId: string) => {
    setSelectedGuardId(guardId);
    setView('guards');
  };

  const handleCompleteCheckpoint = useCallback((siteId: string, checkpointId: string) => {
    setSites((prev) => prev.map((s) => {
      if (s.id !== siteId) return s;
      const updatedCheckpoints = s.patrolCheckpoints.map((cp) =>
        cp.id === checkpointId ? { ...cp, completed: true } : cp
      );
      const allComplete = updatedCheckpoints.every((cp) => cp.completed);
      return { ...s, patrolCheckpoints: updatedCheckpoints, status: allComplete ? 'healthy' as const : s.status, patrolOverdue: allComplete ? false : s.patrolOverdue };
    }));
    const siteName = sites.find((s) => s.id === siteId)?.name || 'Site';
    addActivity(`Patrol checkpoint completed at ${siteName}`, 'patrol', { siteId });
    setInsights((prev) => prev.map((ins) => ins.category === 'Patrol Risk' ? { ...ins, resolved: true } : ins));
    setClientReports((prev) => prev.map((r) => r.siteId === siteId ? { ...r, patrolsCompleted: r.patrolsCompleted + 1, status: 'healthy' as const } : r));
  }, [sites, addActivity]);

  const handleResolveIncident = useCallback(() => {
    setIncident((prev) => ({ ...prev, status: 'resolved', timeline: [...prev.timeline, { time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), message: 'Incident resolved — vehicle left site after verification', type: 'resolved' }] }));
    setSites((prev) => prev.map((s) => s.id === 'westfield' ? { ...s, hasOpenIncident: false } : s));
    addActivity('Incident INC-1048 resolved at Westfield Construction', 'incident', { siteId: 'westfield' });
    setClientReports((prev) => prev.map((r) => r.siteId === 'westfield' ? { ...r, incidentsResolved: r.incidentsResolved + 1, status: 'healthy' as const } : r));
  }, [addActivity]);

  const handleAssignGuard = useCallback((shiftId: string, guardId: string) => {
    setRotaShifts((prev) => prev.map((s) => {
      if (s.id !== shiftId) return s;
      const newAssigned = [...s.assignedGuards, guardId];
      return { ...s, assignedGuards: newAssigned, status: newAssigned.length >= s.requiredGuards ? 'covered' as const : 'attention' as const };
    }));
    const guardName = GUARDS.find((g) => g.id === guardId)?.name || 'Guard';
    addActivity(`${guardName} assigned to shift`, 'rota');
    setInsights((prev) => prev.map((ins) => ins.category === 'Rota Risk' ? { ...ins, resolved: true } : ins));
  }, [addActivity]);

  const resetAll = useCallback(() => {
    setView('command');
    setSites(SITES.map((s) => ({ ...s, patrolCheckpoints: s.patrolCheckpoints.map((c) => ({ ...c })) })));
    setIncident({ ...INCIDENT, timeline: INCIDENT.timeline.map((t) => ({ ...t })) });
    setRotaShifts(ROTA_SHIFTS.map((s) => ({ ...s, assignedGuards: [...s.assignedGuards] })));
    setActivities(INITIAL_ACTIVITIES.map((a) => ({ ...a })));
    setInsights(INITIAL_INSIGHTS.map((i) => ({ ...i })));
    setClientReports(CLIENT_REPORTS.map((r) => ({ ...r })));
    setSelectedSiteId(null);
    setSelectedGuardId(null);
    setTourActive(false);
    setTourStep(0);
    setShowEnquiry(false);
    setShowCompletion(false);
    setEntryDismissed(false);
    sessionStorage.removeItem('gh_skip_entry');
  }, []);

  const selectedSite = useMemo(() => sites.find((s) => s.id === selectedSiteId), [sites, selectedSiteId]);
  const selectedGuard = useMemo(() => GUARDS.find((g) => g.id === selectedGuardId), [selectedGuardId]);
  const showRail = view === 'command' || view === 'sites';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060a14] text-white">
      {!entryDismissed && (
        <DemoEntryOverlay
          product={product}
          onStartTour={() => handleEntryAction('tour')}
          onExploreFreely={() => handleEntryAction('explore')}
          storageKey="gh_skip_entry"
        />
      )}

      <DemoControlBar
        product={product}
        onStartTour={() => { setTourActive(true); setTourStep(0); setView(TOUR_STEPS[0].view); }}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourActive}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onSwitchExperience={() => setShowSwitcher(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar view={view} onNavigate={handleNavigate} mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 lg:p-5">
                {view === 'command' && (
                  <div className="space-y-5">
                    <CommandCentreView
                      sites={sites}
                      guardsOnDuty={guardsOnDuty}
                      totalGuards={totalGuards}
                      openIncidents={openIncidents}
                      compliancePct={compliancePct}
                      onSelectSite={handleSelectSite}
                    />
                    <IntelligencePanel insights={insights} />
                  </div>
                )}
                {view === 'sites' && (
                  selectedSite ? (
                    <SiteDetailPanel site={selectedSite} onClose={() => { setSelectedSiteId(null); setView('command'); }} />
                  ) : (
                    <div className="space-y-5">
                      <h2 className="text-lg font-semibold text-white">All Sites</h2>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sites.map((site) => (
                          <button key={site.id} type="button" onClick={() => setSelectedSiteId(site.id)} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 text-left transition hover:border-white/[0.12] cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-white">{site.name}</span>
                              <span className={`h-2 w-2 rounded-full ${site.status === 'healthy' ? 'bg-emerald-400' : site.status === 'attention' ? 'bg-amber-400' : 'bg-red-400'}`} />
                            </div>
                            <p className="text-[11px] text-slate-500">{site.client}</p>
                            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                              <span>{site.guardsOnDuty} guard{site.guardsOnDuty !== 1 ? 's' : ''}</span>
                              <span>{site.shiftStart} – {site.shiftEnd}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
                {view === 'guards' && (
                  selectedGuard ? (
                    <GuardProfilePanel guard={selectedGuard} onClose={() => { setSelectedGuardId(null); setView('command'); }} />
                  ) : (
                    <div className="space-y-5">
                      <h2 className="text-lg font-semibold text-white">Security Team</h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {GUARDS.map((guard) => (
                          <button key={guard.id} type="button" onClick={() => setSelectedGuardId(guard.id)} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-left transition hover:border-white/[0.12] cursor-pointer">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">{guard.initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{guard.name}</p>
                              <p className="text-[11px] text-slate-500">{guard.role}</p>
                            </div>
                            <span className={`h-2 w-2 rounded-full shrink-0 ${guard.status === 'on_duty' ? 'bg-emerald-400' : guard.status === 'on_break' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
                {view === 'patrols' && <PatrolView sites={sites} onCompleteCheckpoint={handleCompleteCheckpoint} />}
                {view === 'incidents' && <IncidentPanel incident={incident} onResolve={handleResolveIncident} />}
                {view === 'rota' && <RotaView shifts={rotaShifts} availableGuards={GUARDS} onAssignGuard={handleAssignGuard} />}
                {view === 'compliance' && <ComplianceView records={COMPLIANCE_RECORDS} />}
                {view === 'clients' && <ClientView reports={clientReports} />}
              </div>
            </div>
            {showRail && <LiveOperationsRail activities={activities} />}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.04] bg-[#0a0f19] px-4 py-1.5">
            <DemoEnvironmentNotice product={product} />
          </div>
        </main>
      </div>

      <DemoGuidedTour
        product={product}
        active={tourActive}
        step={tourStep}
        total={TOUR_STEPS.length}
        steps={TOUR_STEPS}
        onNext={() => { const n = Math.min(tourStep + 1, TOUR_STEPS.length - 1); setTourStep(n); setView(TOUR_STEPS[n].view); }}
        onBack={() => { const p = Math.max(tourStep - 1, 0); setTourStep(p); setView(TOUR_STEPS[p].view); }}
        onExit={() => { setTourActive(false); if (tourStep === TOUR_STEPS.length - 1) setTimeout(() => setShowCompletion(true), 500); }}
        onShowMe={() => setView(TOUR_STEPS[tourStep].view)}
      />

      <DemoCompletionOverlay product={product} open={showCompletion} onExploreAgain={() => setShowCompletion(false)} />
      <DemoEnquiryPanel product={product} open={showEnquiry} onClose={() => setShowEnquiry(false)} />

      {showSwitcher && <ExperienceSwitcher currentId={product.id} onClose={() => setShowSwitcher(false)} />}
      <ResetConfirmDialog open={showResetConfirm} onConfirm={() => { setShowResetConfirm(false); resetAll(); }} onCancel={() => setShowResetConfirm(false)} />
    </div>
  );
}