'use client';

import Link from 'next/link';

interface ProductCTASectionProps {
  accentColor: string;
  productName: string;
  productStatus: string;
  ctaType: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ctaIcon: string;
  onShowInterestForm: () => void;
}

export default function ProductCTASection({
  accentColor,
  productName,
  productStatus,
  ctaType,
  ctaLabel,
  ctaUrl,
  ctaIcon,
  onShowInterestForm,
}: ProductCTASectionProps) {
  if (!ctaType || ctaType === 'none') return null;

  const label = ctaLabel || 'Learn More';

  if (ctaType === 'visit_product' && ctaUrl && ctaUrl.startsWith('http')) {
    return (
      <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap border hover:bg-slate-50" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
        {label} <i className="ri-external-link-line w-4 h-4 flex items-center justify-center" />
      </a>
    );
  }

  if (ctaType === 'register_interest' || ctaType === 'join_early_access') {
    return (
      <button onClick={onShowInterestForm} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer whitespace-nowrap hover:opacity-90" style={{ backgroundColor: accentColor }}>
        {label} <i className={`${ctaIcon} w-4 h-4 flex items-center justify-center`} />
      </button>
    );
  }

  return (
    <Link href={ctaUrl || '/contact'} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer whitespace-nowrap hover:opacity-90" style={{ backgroundColor: accentColor }}>
      {label} <i className={`${ctaIcon} w-4 h-4 flex items-center justify-center`} />
    </Link>
  );
}