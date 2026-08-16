'use client'

import { useState, useCallback } from 'react'
import { event, initialGuests, initialSuppliers, initialSchedule, initialActivity } from './lib/data'
import type { ViewKey, Guest, Supplier, ScheduleItem, ActivityEvent } from './lib/types'
import { productConfigs } from '../components/shared/product-config'
import DemoControlBar from '../components/shared/DemoControlBar'
import DemoEntryOverlay from '../components/shared/DemoEntryOverlay'
import DemoGuidedTour from '../components/shared/DemoGuidedTour'
import DemoEnquiryPanel from '../components/shared/DemoEnquiryPanel'
import DemoCompletionOverlay from '../components/shared/DemoCompletionOverlay'
import DemoEnvironmentNotice from '../components/shared/DemoEnvironmentNotice'
import ExperienceSwitcher from '../components/shared/ExperienceSwitcher'
import ResetConfirmDialog from '../components/shared/ResetConfirmDialog'

const product = productConfigs['synqoro-event-demo']

export default function SynqoroEventDemoWorkspace() {
  const [view, setView] = useState<ViewKey>('overview')
  const [entryDismissed, setEntryDismissed] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule)
  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivity)
  const [eventStatus, setEventStatus] = useState(event.status)

  const addActivity = useCallback((message: string, type: ActivityEvent['type'] = 'system') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setActivities((prev) => [{ id: `a-${Date.now()}`, time, message, type }, ...prev.slice(0, 9)])
  }, [])

  const handleCheckInGuest = (guestId: string) => {
    setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, checkedIn: true } : g))
    const name = guests.find((g) => g.id === guestId)?.name || 'Guest'
    addActivity(`${name} checked in`, 'guest')
  }

  const handleUpdateSupplier = (supplierId: string, status: Supplier['status']) => {
    setSuppliers((prev) => prev.map((s) => s.id === supplierId ? { ...s, status } : s))
    const name = suppliers.find((s) => s.id === supplierId)?.name || 'Supplier'
    addActivity(`${name} status updated to ${status.replace('_', ' ')}`, 'supplier')
  }

  const handleCompleteScheduleItem = (itemId: string) => {
    setSchedule((prev) => prev.map((s) => s.id === itemId ? { ...s, status: 'completed' } : s))
    const item = schedule.find((s) => s.id === itemId)
    if (item) addActivity(`Schedule: ${item.title} completed`, 'schedule')
  }

  const handleGoLive = () => {
    setEventStatus('live')
    addActivity('Event is now LIVE', 'milestone')
  }

  const startTour = () => {
    setEntryDismissed(true)
    setTourActive(true)
    setTourStep(0)
    sessionStorage.setItem('sq_skip_entry', '1')
  }

  const exploreFreely = () => {
    setEntryDismissed(true)
    sessionStorage.setItem('sq_skip_entry', '1')
  }

  const resetAll = useCallback(() => {
    setGuests(initialGuests)
    setSuppliers(initialSuppliers)
    setSchedule(initialSchedule)
    setActivities(initialActivity)
    setEventStatus('planning')
    setTourActive(false)
    setTourStep(0)
    setShowEnquiry(false)
    setShowCompletion(false)
    setEntryDismissed(false)
    setView('overview')
    sessionStorage.removeItem('sq_skip_entry')
  }, [])

  const rsvpYes = guests.filter((g) => g.rsvp === 'yes').length
  const rsvpPct = Math.round((rsvpYes / guests.length) * 100)
  const supplierConfirmed = suppliers.filter((s) => s.status === 'confirmed' || s.status === 'on_site').length
  const scheduleDone = schedule.filter((s) => s.status === 'completed').length
  const checkedInGuests = guests.filter((g) => g.checkedIn).length

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a14] text-white">
      {!entryDismissed && (
        <DemoEntryOverlay
          product={product}
          onStartTour={startTour}
          onExploreFreely={exploreFreely}
          storageKey="sq_skip_entry"
        />
      )}

      <DemoControlBar
        product={product}
        onStartTour={() => { startTour() }}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourActive}
        onSwitchExperience={() => setShowSwitcher(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 shrink-0 hidden lg:flex flex-col border-r border-white/[0.06] bg-[#0c0c18]">
          <div className="p-4 border-b border-white/[0.06]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-400">Synqoro</p>
            <p className="mt-1 text-sm font-semibold text-white">{event.name}</p>
            <p className="text-[10px] text-slate-500">{event.date}</p>
          </div>

          <div className="p-2 space-y-0.5">
            {[
              { key: 'overview' as ViewKey, label: 'Dashboard', icon: 'ri-dashboard-line' },
              { key: 'guests' as ViewKey, label: 'Guests', icon: 'ri-group-line' },
              { key: 'suppliers' as ViewKey, label: 'Suppliers', icon: 'ri-store-2-line' },
              { key: 'schedule' as ViewKey, label: 'Schedule', icon: 'ri-calendar-check-line' },
              { key: 'live' as ViewKey, label: 'Live Ops', icon: 'ri-live-line' },
              { key: 'reports' as ViewKey, label: 'Reports', icon: 'ri-file-chart-line' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  view === item.key
                    ? 'bg-rose-500/10 text-rose-300'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-sm w-4 h-4 flex items-center justify-center`} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleGoLive}
              disabled={eventStatus !== 'planning'}
              className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {eventStatus === 'live' ? 'Event Live' : 'Go Live'}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-5xl space-y-5">
            {view === 'overview' && (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-400">Event Dashboard</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{event.name}</h2>
                  <p className="text-xs text-slate-400">{event.venue} · {event.date} · {event.timeStart} – {event.timeEnd}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'RSVP Rate', value: `${rsvpPct}%`, sub: `${rsvpYes}/${guests.length}`, color: 'text-emerald-400' },
                    { label: 'Suppliers Ready', value: `${supplierConfirmed}/${suppliers.length}`, sub: 'confirmed', color: 'text-rose-400' },
                    { label: 'Schedule Progress', value: `${scheduleDone}/${schedule.length}`, sub: 'items done', color: 'text-amber-400' },
                    { label: 'Checked In', value: `${checkedInGuests}`, sub: 'guests arrived', color: 'text-cyan-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-[10px] text-slate-500">{stat.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-slate-500">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h3 className="text-xs font-semibold text-white mb-3">Recent Guests</h3>
                    <div className="space-y-2">
                      {guests.slice(0, 4).map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${g.rsvp === 'yes' ? 'bg-emerald-400' : g.rsvp === 'no' ? 'bg-red-400' : 'bg-amber-400'}`} />
                            <span className="text-slate-300">{g.name}</span>
                          </div>
                          <span className="text-slate-500">{g.dietary || 'No dietary req'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h3 className="text-xs font-semibold text-white mb-3">Upcoming Schedule</h3>
                    <div className="space-y-2">
                      {schedule.filter((s) => s.status !== 'completed').slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 w-10 shrink-0">{item.time}</span>
                          <span className="text-slate-300">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {view === 'guests' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Guest List ({guests.length})</h2>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_120px_60px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 border-b border-white/[0.06]">
                    <span>Guest</span><span>RSVP</span><span>Dietary</span><span>In</span>
                  </div>
                  {guests.map((g) => (
                    <div key={g.id} className="grid grid-cols-[1fr_80px_120px_60px] gap-3 px-4 py-2.5 text-xs border-b border-white/[0.03] last:border-0 items-center">
                      <span className="text-slate-300">{g.name}</span>
                      <span className={`text-[10px] font-medium ${g.rsvp === 'yes' ? 'text-emerald-400' : g.rsvp === 'no' ? 'text-red-400' : 'text-amber-400'}`}>
                        {g.rsvp.toUpperCase()}
                      </span>
                      <span className="text-slate-500">{g.dietary || '—'}</span>
                      <button
                        type="button"
                        onClick={() => handleCheckInGuest(g.id)}
                        className={`rounded px-2 py-0.5 text-[10px] font-medium transition cursor-pointer whitespace-nowrap ${
                          g.checkedIn
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-500/10 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'
                        }`}
                      >
                        {g.checkedIn ? 'Yes' : 'Check in'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'suppliers' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Suppliers ({suppliers.length})</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {suppliers.map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{s.name}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                          s.status === 'confirmed' || s.status === 'on_site' ? 'bg-emerald-500/10 text-emerald-400' :
                          s.status === 'booked' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{s.service}</p>
                      <p className="text-[11px] text-slate-500">{s.contact}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">{s.cost}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateSupplier(s.id, s.status === 'booked' ? 'confirmed' : s.status === 'confirmed' ? 'on_site' : 'completed')}
                          className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-400 transition hover:bg-rose-500/20 cursor-pointer whitespace-nowrap"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'schedule' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Event Schedule</h2>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[60px_1fr_150px_80px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 border-b border-white/[0.06]">
                    <span>Time</span><span>Activity</span><span>Assignee</span><span></span>
                  </div>
                  {schedule.map((item) => (
                    <div key={item.id} className={`grid grid-cols-[60px_1fr_150px_80px] gap-3 px-4 py-2.5 text-xs border-b border-white/[0.03] last:border-0 items-center ${item.status === 'completed' ? 'opacity-50' : ''}`}>
                      <span className="text-slate-400">{item.time}</span>
                      <div>
                        <span className={`font-medium ${item.status === 'completed' ? 'text-slate-500' : 'text-slate-200'}`}>{item.title}</span>
                        <p className="text-[10px] text-slate-600 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-slate-500">{item.assignee}</span>
                      {item.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleCompleteScheduleItem(item.id)}
                          className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer whitespace-nowrap"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'live' && (
              <div className="space-y-5 text-center">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 mx-auto mb-4">
                    <i className="ri-live-line text-rose-400 text-3xl"></i>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {eventStatus === 'live' ? 'Event is LIVE' : 'Not yet live'}
                  </h2>
                  {eventStatus === 'live' ? (
                    <>
                      <p className="text-sm text-slate-400 mb-4">Monitoring all operations in real time.</p>
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-500">Guests In</p>
                          <p className="text-xl font-bold text-cyan-400">{checkedInGuests}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-500">Suppliers On Site</p>
                          <p className="text-xl font-bold text-rose-400">{suppliers.filter((s) => s.status === 'on_site').length}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-500">Schedule Done</p>
                          <p className="text-xl font-bold text-emerald-400">{scheduleDone}/{schedule.length}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 mb-6">Click the Go Live button in the sidebar when ready.</p>
                  )}
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
                  <h3 className="text-xs font-semibold text-white mb-3">Activity Feed</h3>
                  <div className="space-y-2">
                    {activities.map((a) => (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-600 w-12 shrink-0">{a.time}</span>
                        <span className="text-slate-400">{a.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === 'reports' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Post-Event Summary</h2>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Guests', value: `${guests.length}`, sub: `${rsvpYes} confirmed` },
                      { label: 'Budget', value: event.budget, sub: `${event.spent} spent` },
                      { label: 'Suppliers', value: `${suppliers.length}`, sub: `${supplierConfirmed} active` },
                      { label: 'Schedule Items', value: `${schedule.length}`, sub: `${scheduleDone} completed` },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-[10px] text-slate-500">{stat.label}</p>
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                        <p className="text-[10px] text-slate-500">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.04] bg-[#0c0c18] px-4 py-1.5">
        <DemoEnvironmentNotice product={product} />
        <span className="text-[10px] text-slate-600">
          {activities[0]?.message} · {activities[0]?.time}
        </span>
      </div>

      <DemoGuidedTour
        product={product}
        active={tourActive}
        step={tourStep}
        total={product.tourSteps.length}
        steps={product.tourSteps}
        onNext={() => { const n = Math.min(tourStep + 1, product.tourSteps.length - 1); setTourStep(n); }}
        onBack={() => setTourStep((s) => Math.max(s - 1, 0))}
        onExit={() => { setTourActive(false); if (tourStep === product.tourSteps.length - 1) setTimeout(() => setShowCompletion(true), 500); }}
      />

      <DemoCompletionOverlay product={product} open={showCompletion} onExploreAgain={() => setShowCompletion(false)} />
      <DemoEnquiryPanel product={product} open={showEnquiry} onClose={() => setShowEnquiry(false)} />

      {showSwitcher && <ExperienceSwitcher currentId={product.id} onClose={() => setShowSwitcher(false)} />}
      <ResetConfirmDialog open={showResetConfirm} onConfirm={() => { setShowResetConfirm(false); resetAll(); }} onCancel={() => setShowResetConfirm(false)} />
    </div>
  )
}