'use client';

import Link from 'next/link';
import { type WebsitePackage, formatPriceShortMinor } from '@/lib/website-packages';

const packageIcons: Record<string, string> = {
  launch: 'ri-rocket-line',
  growth: 'ri-line-chart-line',
  commerce: 'ri-store-2-line',
};

export default function LeftPanel({ pkg }: { pkg: WebsitePackage }) {
  const remainingBalance = pkg.fullPriceMinor - pkg.depositMinor;

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-80px)] bg-[#0B0F14] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)',
        }}
      />

      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 400px 400px at 100% 0%, rgba(139,108,255,0.07), transparent 70%)',
        }}
      />

      <div
        className="absolute bottom-1/3 left-1/3 w-[350px] h-[350px] pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 350px 350px at 50% 50%, rgba(56,232,198,0.05), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
            alt="Digital Footprint"
            width={32}
            height={32}
            className="object-contain rounded-lg"
          />
          <Link
            href="/pricing"
            className="text-xs text-[#64748B] hover:text-[#38E8C6] transition-colors cursor-pointer flex items-center gap-1"
          >
            <i className="ri-arrow-left-line w-3 h-3 flex items-center justify-center" />
            Back to pricing
          </Link>
        </div>

        <p className="text-[10px] sm:text-[11px] text-[#64748B] uppercase tracking-[0.18em] font-semibold mt-6 mb-6">
          Your selected package
        </p>

        <div className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[rgba(17,24,39,0.4)] p-5 relative">
          {pkg.badge && (
            <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#38E8C6] text-[#0B0F14] text-[10px] font-bold uppercase tracking-wider">
              {pkg.badge}
            </span>
          )}

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(56,232,198,0.08)] flex items-center justify-center shrink-0">
              <i className={`${packageIcons[pkg.id] || 'ri-stack-line'} text-[#38E8C6] w-5 h-5 flex items-center justify-center`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F7FA] leading-tight">{pkg.name}</h3>
              <p className="text-sm text-[#AAB4C3]">{pkg.description}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="text-xs text-[#64748B]">From</span>
            <span className="text-2xl font-bold text-[#F5F7FA]">{formatPriceShortMinor(pkg.fullPriceMinor)}</span>
          </div>

          <ul className="space-y-2 mb-2">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-[#AAB4C3]">
                <span className="w-4 h-4 rounded-full bg-[rgba(56,232,198,0.1)] flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-check-line text-[#38E8C6] w-2.5 h-2.5 flex items-center justify-center" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-xs text-[#38E8C6] hover:text-[#5EEDD4] cursor-pointer transition-colors mt-1"
          >
            Change package
            <i className="ri-arrow-right-line w-3 h-3 flex items-center justify-center" />
          </Link>
        </div>

        <p className="text-[10px] sm:text-[11px] text-[#64748B] uppercase tracking-[0.18em] font-semibold mt-8 mb-4">
          Your payment schedule
        </p>

        <div className="space-y-0">
          <StageRow
            stage={1}
            label="Starting payment"
            percentage="50%"
            description="Due today"
            amount={pkg.depositMinor}
            active
          />
          <StageRow
            stage={2}
            label="Design approval"
            percentage="30%"
            description="Due after design approval"
            amount={pkg.secondMilestoneMinor}
          />
          <StageRow
            stage={3}
            label="Pre-launch payment"
            percentage="20%"
            description="Due before launch"
            amount={pkg.finalMilestoneMinor}
            isLast
          />
        </div>

        <div className="mt-5 rounded-xl border border-[rgba(148,163,184,0.1)] bg-[rgba(17,24,39,0.3)] p-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#AAB4C3]">Due today</span>
            <span className="text-lg font-bold text-[#38E8C6]">
              {formatPriceShortMinor(pkg.depositMinor)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#AAB4C3]">Remaining project balance</span>
            <span className="text-sm font-semibold text-[#F5F7FA]">
              {formatPriceShortMinor(remainingBalance)}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#64748B] mt-4 leading-relaxed">
          Only the 50% starting payment is collected today. The remaining balance is invoiced when the agreed milestones are reached.
        </p>

        <div className="mt-auto pt-8">
          <div className="space-y-3">
            <TrustPoint icon="ri-shield-check-line" text="Secure payment through Stripe" />
            <TrustPoint icon="ri-calendar-check-line" text="Clear milestone payments" />
            <TrustPoint icon="ri-customer-service-2-line" text="UK-based project support" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StageRow({
  stage,
  label,
  percentage,
  description,
  amount,
  active = false,
  isLast = false,
}: {
  stage: number;
  label: string;
  percentage: string;
  description: string;
  amount: number;
  active?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
            active
              ? 'border-[#38E8C6] bg-[rgba(56,232,198,0.1)] text-[#38E8C6]'
              : 'border-[rgba(148,163,184,0.2)] bg-[rgba(17,24,39,0.4)] text-[#64748B]'
          }`}
        >
          {stage}
        </div>
        {!isLast && (
          <div
            className={`w-px flex-1 min-h-[28px] my-1 ${
              active ? 'bg-[#38E8C6]/30' : 'bg-[rgba(148,163,184,0.12)]'
            }`}
          />
        )}
      </div>
      <div className={`pb-4 ${isLast ? '' : ''}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-semibold ${active ? 'text-[#F5F7FA]' : 'text-[#AAB4C3]'}`}>
            {label}
          </span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            active
              ? 'bg-[rgba(56,232,198,0.12)] text-[#38E8C6]'
              : 'bg-[rgba(148,163,184,0.08)] text-[#64748B]'
          }`}>
            {percentage}
          </span>
        </div>
        <p className="text-xs text-[#64748B]">{description}</p>
        <p className={`text-sm font-semibold mt-1 ${active ? 'text-[#38E8C6]' : 'text-[#AAB4C3]'}`}>
          {formatPriceShortMinor(amount)}
        </p>
      </div>
    </div>
  );
}

function TrustPoint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[rgba(148,163,184,0.06)] flex items-center justify-center shrink-0">
        <i className={`${icon} text-[#64748B] w-4 h-4 flex items-center justify-center`} />
      </div>
      <span className="text-xs text-[#64748B]">{text}</span>
    </div>
  );
}