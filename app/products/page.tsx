'use client';

import { useState, useMemo } from 'react';
import { motion } from '@/components/motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroLightLines from '@/components/HeroLightLines';
import { useProductRegistry, useProductMetrics } from '@/hooks/useCmsData';
import ProductCard from './ProductCard';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Business Software', label: 'Business Software' },
  { key: 'Marketplace', label: 'Marketplace' },
  { key: 'AI and Automation', label: 'AI & Automation' },
  { key: 'Property', label: 'Property' },
  { key: 'Security', label: 'Security' },
  { key: 'Wedding and Events', label: 'Wedding & Events' },
  { key: 'Workplace', label: 'Workplace' },
  { key: 'Other', label: 'Other' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'Live', label: 'Live', color: '#10B981' },
  { key: 'beta', label: 'Beta', color: '#3B82F6' },
  { key: 'Launching Soon', label: 'Coming Soon', color: '#7C3AED' },
];

export default function ProductsPage() {
  const { products, loading } = useProductRegistry({ visibility: 'Public' });
  const { metrics } = useProductMetrics();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.product_name.toLowerCase().includes(q) ||
        (p.short_description || '').toLowerCase().includes(q) ||
        (p.product_category || '').toLowerCase().includes(q) ||
        (p.target_audience || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.product_category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'beta') {
        result = result.filter(p => ['Public Beta', 'Private Beta'].includes(p.product_status));
      } else {
        result = result.filter(p => p.product_status === statusFilter);
      }
    }
    return result;
  }, [products, search, categoryFilter, statusFilter]);

  const featured = useMemo(() => {
    return products.filter(p => p.is_featured).sort((a, b) => (a.featured_sort_order || 99) - (b.featured_sort_order || 99));
  }, [products]);

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,182,212,0.05),transparent_60%)]" />
          <HeroLightLines />
          <div className="relative z-10 max-w-7xl mx-auto">

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                <i className="ri-stack-line w-4 h-4 flex items-center justify-center" />
                Product Portfolio
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900">Our Products</h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                Purpose-built platforms designed to solve real business challenges. Each product is built, maintained and supported by Digital Footprint.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'All Products', value: metrics.total, icon: 'ri-stack-line', color: '#06B6D4' },
                { label: 'Live', value: metrics.live, icon: 'ri-check-double-line', color: '#10B981' },
                { label: 'Beta', value: metrics.beta, icon: 'ri-flask-line', color: '#3B82F6' },
                { label: 'Coming Soon', value: metrics.comingSoon, icon: 'ri-rocket-line', color: '#7C3AED' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <i className={`${stat.icon} w-4 h-4 flex items-center justify-center`} style={{ color: stat.color }} />
                    <span className="text-sm text-slate-500">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
              <div className="relative flex-1 min-w-[200px]">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center" />
                <input
                  type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(sf => (
                  <button
                    key={sf.key}
                    onClick={() => setStatusFilter(sf.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                      statusFilter === sf.key
                        ? 'text-white border-transparent'
                        : 'text-slate-500 border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    style={statusFilter === sf.key ? { backgroundColor: sf.color || '#06B6D4', borderColor: sf.color || '#06B6D4' } : {}}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-500"
                aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                <i className={`${viewMode === 'grid' ? 'ri-list-check' : 'ri-grid-line'} w-5 h-5 flex items-center justify-center`} />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap mb-8">
              {CATEGORY_FILTERS.map(cf => (
                <button
                  key={cf.key}
                  onClick={() => setCategoryFilter(cf.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === cf.key
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cf.label}
                </button>
              ))}
            </div>

            {featured.length > 0 && !search && categoryFilter === 'all' && statusFilter === 'all' && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 rounded-full bg-[#06B6D4]" />
                  <h2 className="text-xl font-bold text-slate-900">Featured Products</h2>
                </div>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'} data-product-shop>
                  {featured.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} viewMode={viewMode} isFeatured />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 rounded-full bg-slate-300" />
                <h2 className="text-xl font-bold text-slate-900">
                  {search || categoryFilter !== 'all' || statusFilter !== 'all' ? 'Results' : 'All Products'}
                </h2>
                <span className="text-sm text-slate-400">({filtered.length})</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="glass-card rounded-2xl p-8 animate-pulse">
                      <div className="h-6 bg-slate-100 rounded w-1/3 mb-4" />
                      <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                      <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-100 rounded-full w-16" />
                        <div className="h-6 bg-slate-100 rounded-full w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                    <i className="ri-inbox-line w-8 h-8 text-slate-400 flex items-center justify-center" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">No Products Found</h3>
                  <p className="text-slate-500 mb-6">Try adjusting your search or filters to find what you are looking for.</p>
                  <button onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] transition-all cursor-pointer whitespace-nowrap">
                    <i className="ri-refresh-line w-4 h-4 flex items-center justify-center" /> Clear Filters
                  </button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'} data-product-shop>
                  {filtered.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

