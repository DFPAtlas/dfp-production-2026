'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from '@/components/motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { productStatusConfig, ctaTypeIcons } from '@/lib/cms-definitions';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';
import ProductCTASection from './ProductCTASection';

interface ProductDetailProps {
  slug: string;
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [showInterestForm, setShowInterestForm] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from('product_registry').select('*').eq('slug', slug).maybeSingle();
      if (cancelled) return;
      setProduct(data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const handleInterestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const honeypot = (formData.get('contact_alt') as string || '').trim();
    if (honeypot) { setFormStatus('success'); return; }
    setFormStatus('submitting');
    setFormError('');
    formData.delete('contact_alt');
    try {
      const result = await submitEnquiry('leads', {
        name: (formData.get('name') as string) || '',
        email: (formData.get('email') as string) || '',
        company_name: (formData.get('company') as string) || null,
        contact_role: (formData.get('role') as string) || null,
        service_interest: (formData.get('product') as string) || null,
        message: (formData.get('reason') as string) || null,
        enquiry_type: 'product_enquiry',
        enquiry_data: { product_slug: (formData.get('product_slug') as string) || null },
        source: 'product_page',
        status: 'new',
        stage: 'new',
        consent_contact: true,
        idempotency_key: makeIdempotencyKey(),
      }, true);

      if (result.code === 'OK') {
        setFormStatus('success');
        form.reset();
        setTimeout(() => { if (mountedRef.current) { setShowInterestForm(false); setFormStatus('idle'); } }, 2500);
      } else {
        setFormError(result.message);
        setFormStatus('error');
      }
    } catch {
      setFormError('Unable to connect. Please check your connection and try again.');
      setFormStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 bg-white flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <i className="ri-inbox-line w-8 h-8 text-slate-400 flex items-center justify-center" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h1>
        <p className="text-slate-500 mb-6">The product you are looking for does not exist or is not publicly available.</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] transition-all cursor-pointer whitespace-nowrap hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" /> View All Products
        </Link>
      </div>
    );
  }

  const statusCfg = productStatusConfig[product.product_status] || { label: product.product_status, color: '#94A3B8' };
  const features = product.feature_summary || [];
  const benefits = product.key_benefits || [];
  const industries = product.industries || [];
  const accentColor = statusCfg.color;
  const ctaIcon = ctaTypeIcons[product.primary_cta_type] || 'ri-arrow-right-line';

  const handleShowInterestForm = () => setShowInterestForm(true);

  return (
    <div className="min-h-screen pt-24 bg-white text-slate-800">
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,182,212,0.04),transparent_60%)]" />
        <div className="relative z-10 max-w-5xl mx-auto">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <Link href="/products" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-8">
              <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" /> All Products
            </Link>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                {product.product_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">{product.product_name}</h1>
                <p className="text-lg font-semibold mt-1" style={{ color: accentColor }}>{product.short_description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>{statusCfg.label}</span>
              {product.product_category && <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">{product.product_category}</span>}
              {product.target_audience && <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">{product.target_audience}</span>}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-12">

              {product.full_description && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-slate-900">About {product.product_name}</h2>
                  <div className="text-slate-500 leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: product.full_description.replace(/\n/g, '<br/>') }} />
                </div>
              )}

              {product.primary_problem && (
                <div className="glass-card rounded-2xl p-8 border border-slate-100">
                  <h2 className="text-xl font-bold mb-3 text-slate-900">The Problem We Solve</h2>
                  <p className="text-slate-500 leading-relaxed">{product.primary_problem}</p>
                </div>
              )}

              {features.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-slate-900">Key Features</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.map((feature: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 glass-card rounded-xl p-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                          <i className={`${feature.icon || 'ri-check-line'} w-5 h-5 flex items-center justify-center`} style={{ color: accentColor }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm">{feature.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {benefits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-slate-900">Benefits</h2>
                  <div className="space-y-3">
                    {benefits.map((b: string, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <i className="ri-check-double-line w-5 h-5 flex items-center justify-center" style={{ color: accentColor }} />
                        <span className="text-slate-600">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {industries.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-slate-900">Industries</h2>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((ind: string, i: number) => (
                      <span key={i} className="px-4 py-2 rounded-full text-sm font-medium bg-slate-50 text-slate-600 border border-slate-100">{ind}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="section-dark-alt rounded-2xl p-10 border border-slate-200 text-center">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">
                  {product.product_status === 'Live' ? `Ready to Explore ${product.product_name}?` : `Interested in ${product.product_name}?`}
                </h2>
                <p className="text-slate-500 mb-6 max-w-xl mx-auto">
                  {product.product_status === 'Live' ? `Visit ${product.product_name} to see it in action.` : `Register your interest and we will keep you updated.`}
                </p>
                <ProductCTASection
                  accentColor={accentColor}
                  productName={product.product_name}
                  productStatus={product.product_status}
                  ctaType={product.primary_cta_type}
                  ctaLabel={product.primary_cta_label}
                  ctaUrl={product.primary_cta_url}
                  ctaIcon={ctaIcon}
                  onShowInterestForm={handleShowInterestForm}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="space-y-6">
              <div className="glass-card rounded-2xl p-6 sticky top-28">
                <h3 className="font-bold text-lg mb-4 text-slate-800">Availability</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="text-sm font-semibold" style={{ color: accentColor }}>{statusCfg.label}</span>
                  </div>
                  {product.launch_stage && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Stage</span>
                      <span className="text-sm font-medium text-slate-700">{product.launch_stage}</span>
                    </div>
                  )}
                  {product.pricing_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Pricing</span>
                      <span className="text-sm font-medium text-slate-700">{product.pricing_status}</span>
                    </div>
                  )}
                  {product.demo_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Demo</span>
                      <span className="text-sm font-medium text-slate-700">{product.demo_status}</span>
                    </div>
                  )}
                  {product.early_access_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Early Access</span>
                      <span className="text-sm font-medium text-slate-700">{product.early_access_status}</span>
                    </div>
                  )}
                  {product.availability_notes && (
                    <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">{product.availability_notes}</p>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <ProductCTASection
                  accentColor={accentColor}
                  productName={product.product_name}
                  productStatus={product.product_status}
                  ctaType={product.primary_cta_type}
                  ctaLabel={product.primary_cta_label}
                  ctaUrl={product.primary_cta_url}
                  ctaIcon={ctaIcon}
                  onShowInterestForm={handleShowInterestForm}
                />
                  {product.secondary_cta_label && (
                    <Link
                      href={product.secondary_cta_url || '/contact'}
                      className="block w-full text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap border hover:bg-slate-50"
                      style={{ color: accentColor, borderColor: `${accentColor}30` }}
                    >
                      {product.secondary_cta_label}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {showInterestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowInterestForm(false); }}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Register Interest — {product.product_name}</h3>
              <button onClick={() => setShowInterestForm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer text-slate-400">
                <i className="ri-close-line w-5 h-5 flex items-center justify-center" />
              </button>
            </div>
            {formStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line w-8 h-8 text-emerald-500 flex items-center justify-center" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Thank You</h4>
                <p className="text-sm text-slate-500">We have received your interest. The team will be in touch.</p>
              </div>
            ) : (
              <form data-readdy-form onSubmit={handleInterestSubmit} className="space-y-4">
                <input type="text" name="contact_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="absolute opacity-0 pointer-events-none" />
                <input type="hidden" name="product" value={product.product_name} />
                <input type="hidden" name="product_slug" value={product.slug} />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                  <input type="text" name="name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Work Email *</label>
                  <input type="email" name="email" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Company</label>
                  <input type="text" name="company" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]" placeholder="Your company" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                  <input type="text" name="role" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]" placeholder="Your role" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reason for Interest *</label>
                  <textarea name="reason" required maxLength={500} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] resize-none" placeholder="Tell us why you are interested..." />
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" name="consent" required id="interest-consent" className="mt-1 shrink-0" />
                  <label htmlFor="interest-consent" className="text-xs text-slate-500">I agree to Digital Footprint processing my data in accordance with the Privacy Policy.</label>
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <button type="submit" disabled={formStatus === 'submitting'} className="w-full px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">
                  {formStatus === 'submitting' ? 'Submitting...' : 'Submit Interest'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}