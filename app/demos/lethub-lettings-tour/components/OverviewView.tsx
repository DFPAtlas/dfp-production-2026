'use client';

import type { Property, AttentionItem, Insight } from '../lib/types';

interface Props {
  properties: Property[];
  attention: AttentionItem[];
  insights: Insight[];
  onNavigate: (view: string) => void;
  onAttentionClick: (item: AttentionItem) => void;
}

export default function OverviewView({ properties, attention, insights, onNavigate, onAttentionClick }: Props) {
  const occupied = properties.filter((p) => p.status === 'Occupied').length;
  const totalRent = properties.reduce((sum, p) => sum + (p.status === 'Occupied' ? p.rentAmount : 0), 0);
  const openRepairs = properties.reduce((sum, p) => sum + p.openRepairs, 0);
  const avgHealth = Math.round(properties.reduce((sum, p) => sum + p.healthScore, 0) / properties.length);

  const categoryScores = {
    overall: avgHealth,
    rent: 94,
    maintenance: openRepairs > 0 ? 78 : 92,
    compliance: Math.round((properties.filter((p) => p.complianceStatus === 'Current').length / properties.length) * 100),
    tenancies: Math.round((occupied / properties.length) * 100),
  };

  const activeInsights = insights.filter((i) => i.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#1a2332]">Good afternoon.</h2>
        <p className="mt-1 text-sm text-[#8a8a8a]">
          Your portfolio is {avgHealth >= 80 ? 'healthy' : 'managing well'},
          {attention.length > 0 ? ` but ${attention.length} things need attention.` : ' with nothing urgent right now.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Properties', value: String(properties.length), sub: `${occupied} occupied` },
          { label: 'Occupied', value: String(occupied), sub: 'of 12 total' },
          { label: 'Rent Due', value: `£${totalRent.toLocaleString()}`, sub: 'This month' },
          { label: 'Open Repairs', value: String(openRepairs), sub: openRepairs > 0 ? 'Need action' : 'All clear' },
          { label: 'Compliance', value: `${categoryScores.compliance}%`, sub: 'Portfolio score' },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => onNavigate(
              m.label === 'Properties' || m.label === 'Occupied' ? 'properties' :
              m.label === 'Rent Due' ? 'rent' :
              m.label === 'Open Repairs' ? 'maintenance' : 'compliance'
            )}
            className="rounded-xl border border-[#e8e5df] bg-white p-4 text-left transition hover:border-[#0d9488]/30 hover:shadow-sm cursor-pointer"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">{m.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-[#1a2332]">{m.value}</p>
            <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{m.sub}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e8e5df] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1a2332]">Portfolio Health</h3>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${avgHealth >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {avgHealth >= 80 ? 'Healthy' : 'Attention'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Object.entries(categoryScores).map(([key, score]) => (
            <div key={key} className="text-center">
              <div className="relative mx-auto h-16 w-16">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f0eeea" strokeWidth="3" />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${score}, 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#1a2332]">{score}</span>
              </div>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#8a8a8a]">
                {key === 'overall' ? 'Overall' : key.charAt(0).toUpperCase() + key.slice(1)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {attention.length > 0 && (
        <div className="rounded-xl border border-[#e8e5df] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#1a2332]">Needs Your Attention</h3>
          <div className="space-y-2">
            {attention.map((item) => (
              <button
                key={item.id}
                onClick={() => onAttentionClick(item)}
                className="flex w-full items-center gap-3 rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3 text-left transition hover:border-[#0d9488]/30 hover:bg-[#f0eeea] cursor-pointer"
              >
                <span className={`h-2 w-2 rounded-full ${item.priority === 'High' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1a2332]">{item.title}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${item.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{item.property} — {item.detail}</p>
                </div>
                <i className="ri-arrow-right-s-line text-sm text-[#8a8a8a]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {activeInsights.length > 0 && (
        <div className="rounded-xl border border-[#e8e5df] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#1a2332]">Portfolio Insights</h3>
          <div className="space-y-2">
            {activeInsights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-3 rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0d9488]/10">
                  <i className="ri-lightbulb-line text-sm text-[#0d9488]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#1a2332]">{insight.title}</p>
                  <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{insight.detail}</p>
                </div>
                <button
                  onClick={() => onNavigate(insight.category)}
                  className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[10px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
                >
                  {insight.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}