'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { ALLOWED_PUBLIC_EVENTS, ConsentState } from '@/lib/analytics-definitions';

type DateRange = '7d' | '30d' | '90d' | '365d';

interface MetricCard {
  label: string;
  value: string | number;
  sub?: string;
}

export default function PublicAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const metrics: MetricCard[] = [
    { label: 'Page Views', value: 'Not available', sub: 'Requires server-side event store' },
    { label: 'Unique Sessions', value: 'Not available', sub: 'Requires server-side event store' },
    { label: 'Demo Requests', value: 'Not available', sub: 'Check CRM leads with source=demo_request' },
    { label: 'Contact Submissions', value: 'Not available', sub: 'Check CRM leads with source=contact_form or website_form' },
    { label: 'Partner Applications', value: 'Not available', sub: 'View in CMS → Partner Applications' },
    { label: 'Career Applications', value: 'Not available', sub: 'View in CMS → Careers or Admin → Recruitment' },
    { label: 'Support Requests', value: 'Not available', sub: 'Check support inbox' },
    { label: 'Referral Submissions', value: 'Not available', sub: 'View in CMS → Partner Applications' },
  ];

  const conversionDefinitions = [
    { event: 'contact_submitted', source: 'CRM (leads table, source=website_form/contact_form)', dashboard: 'Admin → Leads' },
    { event: 'demo_request_submitted', source: 'CRM (leads table, source=demo_request)', dashboard: 'Admin → Leads' },
    { event: 'partner_application_submitted', source: 'partner_applications table', dashboard: 'Admin → CMS → Partner Applications' },
    { event: 'career_application_submitted', source: 'career_applications table', dashboard: 'Admin → Recruitment' },
    { event: 'support_request_submitted', source: 'digital_footprint_support table', dashboard: 'Admin → Command Centre → Support' },
    { event: 'referral_submitted', source: 'partner_applications table (type=referral)', dashboard: 'Admin → CMS → Partner Applications' },
    { event: 'early_access_submitted', source: 'CRM (leads table)', dashboard: 'Admin → Leads' },
  ];

  const eventCatalogueSections = [
    {
      title: 'Core Navigation',
      events: ['public_page_viewed', 'primary_navigation_selected', 'footer_link_selected', 'account_gateway_opened'],
    },
    {
      title: 'Products & Demos',
      events: ['product_directory_viewed', 'product_viewed', 'product_cta_selected', 'demo_viewed', 'demo_started', 'demo_request_submitted', 'early_access_submitted'],
    },
    {
      title: 'Services & Enquiries',
      events: ['service_viewed', 'contact_started', 'contact_submitted', 'strategy_request_submitted', 'quote_request_submitted'],
    },
    {
      title: 'Help & Trust',
      events: ['help_search_used', 'help_article_viewed', 'support_request_submitted', 'status_page_viewed', 'security_report_submitted', 'accessibility_issue_submitted'],
    },
    {
      title: 'People & Ecosystem',
      events: ['team_profile_viewed', 'partner_application_submitted', 'referral_submitted', 'vacancy_viewed', 'career_application_submitted'],
    },
    {
      title: 'Consent',
      events: ['cookie_consent_updated', 'cookie_consent_withdrawn'],
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Admin</Link>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-slate-700">Public Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Public Website Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Privacy-first measurement for public pages and conversion journeys.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 rounded-full p-1">
            {(['7d', '30d', '90d', '365d'] as DateRange[]).map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  dateRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '12 Months'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl bg-slate-50 border border-slate-200 p-5 animate-pulse">
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-7 bg-slate-200 rounded w-1/2 mb-2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-10 p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <i className="ri-information-line w-5 h-5 text-amber-500 flex items-center justify-center mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">Server-Side Event Store Not Configured</h3>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Client-side analytics events are dispatched to Google Analytics (when consent is given), but no server-side event store is connected.
                    Aggregate metrics below reflect what can be derived from existing CRM and application tables.
                    To enable full analytics, connect a <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">public_analytics_events</code> table.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {metrics.map(m => (
                <div key={m.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{m.label}</p>
                  <p className="text-2xl font-bold text-slate-300 mb-1">{m.value}</p>
                  {m.sub && <p className="text-xs text-slate-400">{m.sub}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Event Catalogue</h2>
            <div className="space-y-5">
              {eventCatalogueSections.map(section => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {section.events.map(ev => (
                      <span
                        key={ev}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-5 pt-4 border-t border-slate-100">
              {ALLOWED_PUBLIC_EVENTS.length} approved events in catalogue. Events are dispatched to GA when analytics consent is granted.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Conversion Definitions</h2>
            <p className="text-xs text-slate-500 mb-4">
              Conversions are only counted when the server confirms the underlying record was created. Button clicks are not counted as conversions.
            </p>
            <div className="space-y-3">
              {conversionDefinitions.map(conv => (
                <div key={conv.event} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/8 flex items-center justify-center shrink-0">
                    <i className="ri-check-double-line w-4 h-4 text-[#06B6D4] flex items-center justify-center" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{conv.event.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">Source: {conv.source}</p>
                    <p className="text-xs text-[#06B6D4]">Dashboard: {conv.dashboard}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Consent & Privacy</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Client-side analytics (GA)</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#06B6D4]/10 text-[#06B6D4]">Consent-gated</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">IP anonymisation</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">No personal data in events</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Enforced</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Admin/Staff session exclusion</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Cross-domain tracking</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 text-slate-500">Disabled by default</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Sensitive query param stripping</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Conversion idempotency</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Active (localStorage)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-600">Event idempotency</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Active (5s sessionStorage)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Data Quality & Monitoring</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">CRM/Lead Source Reference</h3>
                <p className="text-xs text-slate-500 mb-2">
                  Cross-reference CRM lead sources against analytics conversions to detect mismatches.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">website_form</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">contact_form</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">demo_request</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">partner_application</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">career_application</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">UTM Parameter Handling</h3>
                <p className="text-xs text-slate-500">
                  UTM parameters are captured from the URL and sanitised (max 256 chars per value). Sensitive query parameters are stripped before dispatch.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Provider Status</h3>
                <p className="text-xs text-slate-500">
                  Events are dispatched to Google Analytics when consent is granted. Provider failures are handled silently and do not break page functionality.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10">
          <h2 className="text-base font-bold text-slate-900 mb-4">Public Pages Tracked</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              '/ (Home)', '/about', '/products', '/products/[slug]', '/services',
              '/demos', '/demos/[slug]', '/request-demo', '/contact',
              '/partners', '/partners/apply', '/partners/referrals', '/partners/suppliers', '/partners/technology',
              '/careers', '/careers/[slug]', '/careers/apply/[slug]', '/careers/early-careers',
              '/blog', '/help', '/help/[category]', '/help/article/[slug]',
              '/team', '/team/[slug]', '/case-studies', '/industries',
              '/support', '/support/request', '/support/status',
              '/uat-testing', '/login', '/account',
            ].map(p => (
              <span key={p} className="text-xs text-slate-500 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 font-mono">{p}</span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Funnel Definitions</h2>
          <div className="space-y-3">
            {[
              { name: 'Product Conversion', steps: 'Landing → Product Page → Demo Request', note: 'Users may enter or leave at any step' },
              { name: 'Service Enquiry', steps: 'Service Page → Contact Start → Contact Submitted', note: 'Tracking may be incomplete due to consent or blockers' },
              { name: 'Help to Support', steps: 'Help Search → Article → Support Request', note: 'Users may resolve issues without submitting' },
              { name: 'Careers to Application', steps: 'Careers Page → Vacancy → Application', note: 'Not all vacancy views result in applications' },
              { name: 'Partner to Application', steps: 'Partner Page → Application Start → Submitted', note: 'Multiple application types exist' },
            ].map(f => (
              <div key={f.name} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{f.name}</h3>
                <p className="text-xs text-slate-500 mb-1">{f.steps}</p>
                <p className="text-[10px] text-slate-400 italic">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}