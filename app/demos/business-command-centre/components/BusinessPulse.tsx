'use client';

import RadarChart from './RadarChart';
import { pulseDomains } from '../lib/data';

export default function BusinessPulse() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Business Pulse</h3>
        <p className="mt-0.5 text-[10px] text-slate-600">Live health of key business domains</p>
      </div>

      <RadarChart domains={pulseDomains} />
    </div>
  );
}