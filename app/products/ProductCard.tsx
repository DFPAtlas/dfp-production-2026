'use client';

import Link from 'next/link';
import { motion } from '@/components/motion';
import { productStatusConfig } from '@/lib/cms-definitions';

interface ProductCardProps {
  product: any;
  index: number;
  viewMode: string;
  isFeatured?: boolean;
}

export default function ProductCard({ product, index, viewMode, isFeatured }: ProductCardProps) {
  const statusCfg = productStatusConfig[product.product_status] || { label: product.product_status, color: '#94A3B8' };
  const ctaIcon = product.primary_cta_type === 'visit_product' ? 'ri-external-link-line' : 'ri-arrow-right-line';
  const ctaLabel = product.primary_cta_label || 'Learn More';
  const ctaUrl = product.primary_cta_type === 'visit_product' && product.public_url
    ? product.public_url
    : `/products/${product.slug}`;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
        className="glass-card rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-300 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0" style={{ backgroundColor: `${statusCfg.color}12`, color: statusCfg.color }}>
          {product.product_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-800">{product.product_name}</h3>
            {isFeatured && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#06B6D4]/10 text-[#06B6D4]">Featured</span>}
          </div>
          <p className="text-sm text-slate-500 truncate">{product.short_description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}>{statusCfg.label}</span>
          {product.product_category && <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100 hidden sm:inline">{product.product_category}</span>}
          {ctaUrl.startsWith('http') ? (
            <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer whitespace-nowrap border hover:bg-slate-50" style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30` }}>
              {ctaLabel} <i className={`${ctaIcon} w-3.5 h-3.5 flex items-center justify-center`} />
            </a>
          ) : (
            <Link href={ctaUrl} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer whitespace-nowrap border hover:bg-slate-50" style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30` }}>
              {ctaLabel} <i className={`${ctaIcon} w-3.5 h-3.5 flex items-center justify-center`} />
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="glass-card rounded-2xl overflow-hidden group hover:border-slate-300 transition-all"
    >
      <div className="p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: `${statusCfg.color}12`, color: statusCfg.color }}>
              {product.product_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800">{product.product_name}</h3>
                {isFeatured && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#06B6D4]/10 text-[#06B6D4]">Featured</span>}
              </div>
              <p className="text-sm font-semibold mt-0.5" style={{ color: statusCfg.color }}>{product.short_description?.substring(0, 60) || ''}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0" style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">{product.short_description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {product.product_category && <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">{product.product_category}</span>}
          {product.target_audience && <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">{product.target_audience}</span>}
          {product.demo_status && product.demo_status !== 'Not available' && <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">Demo Available</span>}
        </div>
        <div className="flex items-center gap-3">
          {ctaUrl.startsWith('http') ? (
            <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer whitespace-nowrap hover:opacity-90" style={{ backgroundColor: statusCfg.color }}>
              {ctaLabel} <i className={`${ctaIcon} w-4 h-4 flex items-center justify-center`} />
            </a>
          ) : (
            <Link href={ctaUrl} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer whitespace-nowrap hover:opacity-90" style={{ backgroundColor: statusCfg.color }}>
              {ctaLabel} <i className={`${ctaIcon} w-4 h-4 flex items-center justify-center`} />
            </Link>
          )}
          <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap border hover:bg-slate-50" style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30` }}>
            Details <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}