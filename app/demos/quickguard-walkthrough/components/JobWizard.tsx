import { useState } from 'react';
import type { DemoJob, SecurityType } from '../lib/types';
import { SECURITY_TYPES, REQUIREMENT_OPTIONS } from '../lib/data';

interface JobWizardProps {
  step: number;
  onStepChange: (step: number) => void;
  job: DemoJob;
  onComplete: (job: DemoJob) => void;
  onCancel: () => void;
}

export default function JobWizard({ step, onStepChange, job, onComplete, onCancel }: JobWizardProps) {
  const [localJob, setLocalJob] = useState<DemoJob>({ ...job });
  const [selectedType, setSelectedType] = useState<SecurityType>(localJob.securityType);
  const [location, setLocation] = useState(localJob.location);
  const [city, setCity] = useState(localJob.city);
  const [guardCount, setGuardCount] = useState(localJob.guardsRequired);
  const [selectedReqs, setSelectedReqs] = useState<string[]>([...localJob.requirements]);

  const toggleRequirement = (req: string) => {
    setSelectedReqs((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const handleNext = () => {
    if (step < 5) {
      onStepChange(step + 1);
    } else {
      onComplete({
        ...localJob,
        securityType: selectedType,
        location,
        city,
        guardsRequired: guardCount,
        requirements: selectedReqs,
      });
    }
  };

  const steps = ['Type', 'Location', 'Schedule', 'Guards', 'Requirements', 'Review'];

  return (
    <div id="matching-view" className="space-y-5">
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition ${
                i <= step ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-600'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-[10px] font-medium hidden sm:inline ${
              i <= step ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-3 bg-white/[0.06]" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">What do you need?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SECURITY_TYPES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setSelectedType(st.value)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${
                    selectedType === st.value
                      ? 'border-blue-500/30 bg-blue-500/[0.08]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    selectedType === st.value ? 'bg-blue-500/15 text-blue-400' : 'bg-white/[0.04] text-slate-500'
                  }`}>
                    <i className={`${st.icon} text-base`}></i>
                  </div>
                  <span className={`text-sm font-medium ${
                    selectedType === st.value ? 'text-white' : 'text-slate-400'
                  }`}>
                    {st.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Where do you need security?</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Location name</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/40"
                  placeholder="Venue or site name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/40"
                  placeholder="City"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">When do you need guards?</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                    <i className="ri-calendar-line text-blue-400 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Saturday, 16 August</p>
                    <p className="text-xs text-slate-400">Demo date — one week from now</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                    <i className="ri-time-line text-slate-400 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">18:00 – 01:00</p>
                    <p className="text-xs text-slate-400">7 hours · Evening shift</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">How many guards?</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setGuardCount(Math.max(1, guardCount - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-lg font-bold transition hover:bg-white/[0.06] cursor-pointer"
              >
                −
              </button>
              <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/[0.06]">
                <span className="text-2xl font-bold text-white">{guardCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setGuardCount(Math.min(10, guardCount + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-lg font-bold transition hover:bg-white/[0.06] cursor-pointer"
              >
                +
              </button>
              <span className="text-sm text-slate-500">guard{guardCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Requirements</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {REQUIREMENT_OPTIONS.map((req) => (
                <button
                  key={req}
                  type="button"
                  onClick={() => toggleRequirement(req)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                    selectedReqs.includes(req)
                      ? 'border-blue-500/30 bg-blue-500/[0.08]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    selectedReqs.includes(req) ? 'bg-blue-500/15' : 'bg-white/[0.04]'
                  }`}>
                    <i className={`${
                      selectedReqs.includes(req) ? 'ri-checkbox-circle-fill text-blue-400' : 'ri-checkbox-blank-circle-line text-slate-600'
                    } text-sm`}></i>
                  </div>
                  <span className={`text-sm ${
                    selectedReqs.includes(req) ? 'text-white font-medium' : 'text-slate-400'
                  }`}>
                    {req}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Review your request</h2>
            <div className="space-y-3">
              <div className="flex justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-slate-400">Type</span>
                <span className="text-sm font-medium text-white">{selectedType}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-slate-400">Location</span>
                <span className="text-sm font-medium text-white">{location}, {city}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-slate-400">Schedule</span>
                <span className="text-sm font-medium text-white">Saturday · 18:00–01:00 · 7h</span>
              </div>
              <div className="flex justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-slate-400">Guards</span>
                <span className="text-sm font-medium text-white">{guardCount} required</span>
              </div>
              <div className="flex justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-slate-400">Requirements</span>
                <span className="text-sm font-medium text-white text-right max-w-[200px]">
                  {selectedReqs.join(', ') || 'None selected'}
                </span>
              </div>
              <div className="rounded-lg border border-blue-500/15 bg-blue-500/[0.04] px-4 py-3">
                <div className="flex items-center gap-2">
                  <i className="ri-information-line text-blue-400 text-sm"></i>
                  <span className="text-xs text-blue-300">Demo estimate — no real pricing is used</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => onStepChange(step - 1)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 cursor-pointer"
            >
              {step === 5 ? 'Post Demo Job' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}