'use client'

import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import {
  ActivityEvent,
  DemoTask,
  Insight,
  MetricCard,
  ViewKey,
} from './lib/types'
import {
  initialActivity,
  attentionItems,
  initialTasks,
  metrics,
  projects,
  teamCapacity,
  tourSteps,
  insights as baseInsights,
  financeMetrics,
} from './lib/data'

import { productConfigs } from '../components/shared/product-config'
import DemoControlBar from '../components/shared/DemoControlBar'
import DemoEntryOverlay from '../components/shared/DemoEntryOverlay'
import DemoGuidedTour from '../components/shared/DemoGuidedTour'
import DemoEnquiryPanel from '../components/shared/DemoEnquiryPanel'
import DemoCompletionOverlay from '../components/shared/DemoCompletionOverlay'
import DemoEnvironmentNotice from '../components/shared/DemoEnvironmentNotice'
import ExperienceSwitcher from '../components/shared/ExperienceSwitcher'
import ResetConfirmDialog from '../components/shared/ResetConfirmDialog'
import Sidebar from './components/Sidebar'
import IntelligenceRail from './components/IntelligenceRail'

import OverviewView from './components/views/OverviewView'
import ProjectsView from './components/views/ProjectsView'
import PeopleView from './components/views/PeopleView'
import TasksView from './components/views/TasksView'
import FinanceView from './components/views/FinanceView'

const product = productConfigs['business-command-centre']

export default function BusinessCommandCentreWorkspace() {
  const [view, setView] = useState<ViewKey>('overview')
  const [showEntry, setShowEntry] = useState(true)
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(initialActivity)
  const [tasksState, setTasksState] = useState<DemoTask[]>(initialTasks)
  const [teamRelieved, setTeamRelieved] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const urgentCount = useMemo(
    () => tasksState.filter((t) => t.priority === 'High' && !t.completed).length,
    [tasksState],
  )

  const currentInsights = useMemo<Insight[]>(() => {
    const list = [...baseInsights]
    if (teamRelieved) {
      list[0] = {
        ...list[0],
        title: 'Revenue is trending 18.8% above plan',
        detail: 'Capacity risk resolved. Engineering now at 78%.',
        recommendation: 'Monitor weekly.',
        resolved: true,
      }
    }
    if (urgentCount <= 1) {
      list[1] = {
        ...list[1],
        title: '30 day forecast updated',
        detail: 'Urgent actions reduced. Revenue forecast improved.',
        recommendation: '+18% – 24% vs prior 30 days',
        resolved: true,
      }
    }
    return list
  }, [teamRelieved, urgentCount])

  const currentMetrics = useMemo<MetricCard[]>(() => {
    return metrics.map((m) => {
      if (m.label === 'Employee NPS') {
        return { ...m, change: teamRelieved ? '+10' : '+8', vsPrior: 'vs prior 53' }
      }
      return m
    })
  }, [teamRelieved])

  const addActivity = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setActivityEvents((prev) => [{ time, message, type: 'system' }, ...prev.slice(0, 9)])
  }, [])

  const selectView = (next: ViewKey) => {
    setView(next)
    addActivity(`Opened ${next}`)
  }

  const startTour = () => {
    setShowEntry(false)
    setTourActive(true)
    setTourStep(0)
    setView(tourSteps[0].view)
    addActivity('Guided Command Centre tour started')
  }

  const exploreFreely = () => {
    setShowEntry(false)
    setView('overview')
  }

  const nextTourStep = () => {
    const next = Math.min(tourStep + 1, tourSteps.length - 1)
    setTourStep(next)
    setView(tourSteps[next].view)
    addActivity(next === tourSteps.length - 1 ? 'Guided tour complete' : `Tour: ${tourSteps[next].title}`)
  }

  const backTourStep = () => {
    const prev = Math.max(tourStep - 1, 0)
    setTourStep(prev)
    setView(tourSteps[prev].view)
  }

  const exitTour = () => {
    setTourActive(false)
    if (tourStep === tourSteps.length - 1) {
      setTimeout(() => { if (!mountedRef.current) return; setShowCompletion(true) }, 500)
    }
  }

  const reset = () => {
    setView('overview')
    setTasksState(initialTasks)
    setTeamRelieved(false)
    setActivityEvents(initialActivity)
    setTourActive(false)
    setTourStep(0)
    setShowEntry(false)
    setShowEnquiry(false)
    setShowCompletion(false)
    setSessionKey((k) => k + 1)
    sessionStorage.removeItem('bcc_skip_entry')
    setTimeout(() => { if (!mountedRef.current) return; setShowEntry(true) }, 150)
  }

  const handleTaskToggle = (id: string) => {
    setTasksState((current) =>
      current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const showRail = view === 'overview' || view === 'projects' || view === 'people' || view === 'tasks' || view === 'finance'

  const viewTitle =
    view === 'projects' ? 'Active Projects'
    : view === 'people' ? 'Team Capacity'
    : view === 'tasks' ? "Today's Work"
    : view === 'finance' ? 'Financial Position'
    : view === 'pulse' ? 'Business Pulse'
    : view === 'attention' ? 'Attention Centre'
    : view === 'activity' ? 'Activity Feed'
    : view === 'workstreams' ? 'Workstreams'
    : view === 'milestones' ? 'Milestones'
    : view === 'resources' ? 'Resources'
    : ''

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060a14] text-white">
      {showEntry && (
        <DemoEntryOverlay
          product={product}
          onStartTour={startTour}
          onExploreFreely={exploreFreely}
          storageKey="bcc_skip_entry"
        />
      )}

      <DemoControlBar
        product={product}
        onStartTour={() => { if (!showEntry) startTour() }}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourActive}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onSwitchExperience={() => setShowSwitcher(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={view}
          onNavigate={selectView}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 lg:p-5" key={sessionKey}>
                {view !== 'overview' && viewTitle && (
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                      {view === 'projects' ? 'Project Delivery'
                        : view === 'people' ? 'People & Culture'
                        : view === 'tasks' ? 'Operational Tasks'
                        : view === 'finance' ? 'Financial Position'
                        : 'Command Centre'}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white">{viewTitle}</h2>
                  </div>
                )}

                {view === 'overview' && (
                  <OverviewView
                    metrics={currentMetrics}
                    attentionItems={attentionItems}
                    activityEvents={activityEvents}
                    projects={projects}
                    teamCapacity={teamCapacity}
                    financeMetrics={financeMetrics}
                    onNavigate={selectView}
                    onActivity={addActivity}
                  />
                )}
                {view === 'projects' && (
                  <ProjectsView projects={projects} onActivity={addActivity} />
                )}
                {(view === 'people' || view === 'resources') && (
                  <PeopleView
                    team={[
                      { name: 'Amelia Hart', role: 'Head of UX', initials: 'AH', capacity: 72, projects: 3, status: 'Balanced', department: 'Design' },
                      { name: 'Chris Morgan', role: 'Head of UI', initials: 'CM', capacity: teamRelieved ? 82 : 94, projects: teamRelieved ? 4 : 5, status: teamRelieved ? 'Balanced' : 'Over capacity', department: 'Design' },
                      { name: 'Sophie Reed', role: 'Project Lead', initials: 'SR', capacity: teamRelieved ? 69 : 61, projects: teamRelieved ? 4 : 3, status: 'Available', department: 'Delivery' },
                      { name: 'Daniel Price', role: 'Automation Engineer', initials: 'DP', capacity: 79, projects: 4, status: 'Balanced', department: 'Engineering' },
                    ]}
                    relieved={teamRelieved}
                    onRelieve={() => { setTeamRelieved(true); addActivity('Reassigned one task from Chris to Sophie') }}
                    onActivity={addActivity}
                  />
                )}
                {view === 'tasks' && (
                  <TasksView tasks={tasksState} onToggleTask={handleTaskToggle} onActivity={addActivity} />
                )}
                {view === 'finance' && (
                  <FinanceView
                    onActivity={addActivity}
                    cashBars={[
                      { month: 'Jan', income: 52, cost: 38 },
                      { month: 'Feb', income: 48, cost: 41 },
                      { month: 'Mar', income: 55, cost: 40 },
                      { month: 'Apr', income: 67, cost: 46 },
                      { month: 'May', income: 74, cost: 49 },
                      { month: 'Jun', income: 86, cost: 58 },
                    ]}
                    milestones={[
                      { date: '30 May', label: 'Orion milestone 3', amount: '£6,800' },
                      { date: '18 Jun', label: 'Atlas phase 2 payment', amount: '£3,200' },
                      { date: '27 Jun', label: 'Helix discovery', amount: '£2,400' },
                    ]}
                  />
                )}
                {(view === 'pulse' || view === 'attention' || view === 'activity' || view === 'workstreams' || view === 'milestones') && (
                  <OverviewView
                    metrics={currentMetrics}
                    attentionItems={attentionItems}
                    activityEvents={activityEvents}
                    projects={projects}
                    teamCapacity={teamCapacity}
                    financeMetrics={financeMetrics}
                    onNavigate={selectView}
                    onActivity={addActivity}
                  />
                )}
              </div>
            </div>

            {showRail && <IntelligenceRail insights={currentInsights} />}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.04] bg-[#0a0f19] px-4 py-1.5">
            <DemoEnvironmentNotice product={product} />
            <span className="text-[10px] text-slate-600">
              {activityEvents[0]?.message} · {activityEvents[0]?.time}
            </span>
          </div>
        </main>
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
  )
}