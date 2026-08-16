'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Eye, Code2, Image, Sun, Moon, Monitor, Smartphone, FileText,
  Search,
} from 'lucide-react';

const DIAGNOSTICS = [
  { category: 'HTML Structure', items: [
    { check: 'Valid HTML5 doctype', status: 'passed', detail: 'Doctype present and valid' },
    { check: 'Table-based layout', status: 'passed', detail: 'All layouts use table structure' },
    { check: 'No scripts or iframes', status: 'passed', detail: 'No executable content detected' },
    { check: 'No external stylesheets', status: 'passed', detail: 'All CSS is inline' },
    { check: 'No invalid nesting', status: 'passed', detail: 'HTML nesting is valid' },
    { check: 'HTML size', status: 'warning', detail: '102.4 KB — near Gmail clipping threshold (102 KB)' },
    { check: 'Lang attribute', status: 'passed', detail: 'lang="en" set on html element' },
  ]},
  { category: 'CSS & Styling', items: [
    { check: 'Inline styles only', status: 'passed', detail: 'No style blocks or external refs' },
    { check: 'Flexbox usage', status: 'warning', detail: '3 flexbox instances — may break in Outlook' },
    { check: 'Grid usage', status: 'passed', detail: 'No CSS grid detected' },
    { check: 'Background images', status: 'warning', detail: '2 background-image uses — need fallback' },
    { check: 'Web fonts', status: 'warning', detail: 'Google Fonts: Inter — ensure system fallback' },
    { check: 'Media queries', status: 'passed', detail: '3 media queries for responsive layout' },
    { check: 'Animations', status: 'passed', detail: 'No CSS animations detected' },
  ]},
  { category: 'Outlook Specific', items: [
    { check: 'Table width attributes', status: 'passed', detail: 'Width set on all tables' },
    { check: 'Image dimensions', status: 'passed', detail: 'Width/height on all img tags' },
    { check: 'Line-height control', status: 'passed', detail: 'Line-height set in px or unitless' },
    { check: 'VML fallbacks', status: 'warning', detail: 'No VML for rounded buttons — Outlook will show square' },
    { check: 'Conditional comments', status: 'failed', detail: 'No Outlook conditional comments for spacing fixes' },
    { check: 'Button fallbacks', status: 'passed', detail: 'Buttons have solid background fallback' },
  ]},
  { category: 'Images & Assets', items: [
    { check: 'Alt text present', status: 'passed', detail: 'All 12 images have alt attributes' },
    { check: 'Image dimensions', status: 'passed', detail: 'All images have explicit dimensions' },
    { check: 'SVG support', status: 'warning', detail: '2 SVGs — unsupported in Outlook, need PNG fallback' },
    { check: 'Animated GIF fallback', status: 'passed', detail: 'GIF has static first frame' },
    { check: 'HTTPS sources', status: 'passed', detail: 'All 14 image URLs use HTTPS' },
    { check: 'Image size', status: 'warning', detail: '3 images over 1 MB — slow loading risk' },
  ]},
  { category: 'Dark Mode', items: [
    { check: 'Logo dark-mode variant', status: 'warning', detail: 'No dark-mode logo variant defined' },
    { check: 'Color contrast (dark bg)', status: 'warning', detail: '3 text elements below 4.5:1 on dark bg' },
    { check: 'Transparent PNGs', status: 'passed', detail: 'All PNGs have background or work on dark bg' },
    { check: 'Button colour safety', status: 'passed', detail: 'Buttons use solid fills with border' },
    { check: 'Border visibility', status: 'passed', detail: 'Borders remain visible in dark mode' },
  ]},
  { category: 'Accessibility', items: [
    { check: 'Color contrast (AA)', status: 'warning', detail: '2 text elements below 4.5:1 ratio' },
    { check: 'Heading order', status: 'passed', detail: 'H1 → H2 → H3 hierarchy maintained' },
    { check: 'Font sizes', status: 'passed', detail: 'Min 14px body text, 12px legal' },
    { check: 'Link descriptions', status: 'passed', detail: 'All links have descriptive text' },
    { check: 'Language attribute', status: 'passed', detail: 'lang and dir attributes set correctly' },
  ]},
  { category: 'Links', items: [
    { check: 'Broken links', status: 'passed', detail: 'All 18 links return 200' },
    { check: 'HTTPS only', status: 'passed', detail: 'No HTTP links detected' },
    { check: 'Redirect chains', status: 'warning', detail: '2 links redirect (1 hop each)' },
    { check: 'Tracking parameters', status: 'passed', detail: 'UTM params clean and consistent' },
    { check: 'Unsubscribe present', status: 'passed', detail: 'Unsubscribe link found and valid' },
  ]},
];

const STATUS_ICONS: Record<string, React.ElementType> = {
  passed: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  passed: 'text-emerald-400 bg-emerald-400/10',
  warning: 'text-amber-400 bg-amber-400/10',
  failed: 'text-red-400 bg-red-400/10',
};

export default function CompatibilityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allItems = DIAGNOSTICS.flatMap((cat) => cat.items.map((item) => ({ ...item, category: cat.category })));
  const categories = ['all', ...DIAGNOSTICS.map((cat) => cat.category)];

  const filtered = allItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.check.toLowerCase().includes(searchQuery.toLowerCase()) && !item.detail.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPassed = allItems.filter((i) => i.status === 'passed').length;
  const totalWarnings = allItems.filter((i) => i.status === 'warning').length;
  const totalFailed = allItems.filter((i) => i.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/render-tests" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Compatibility Diagnostics</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            HTML, CSS, image, dark-mode, accessibility, link and asset diagnostics for email clients.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#121215] border border-emerald-400/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Passed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{totalPassed}</p>
          <p className="text-xs text-slate-500 mt-1">{((totalPassed / allItems.length) * 100).toFixed(0)}% of checks</p>
        </div>
        <div className="bg-[#121215] border border-amber-400/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{totalWarnings}</p>
          <p className="text-xs text-slate-500 mt-1">Needs attention</p>
        </div>
        <div className="bg-[#121215] border border-red-400/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Failed</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{totalFailed}</p>
          <p className="text-xs text-slate-500 mt-1">Must fix</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search diagnostics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer pr-8"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {DIAGNOSTICS.filter((cat) => selectedCategory === 'all' || cat.category === selectedCategory).map((cat) => (
          <div key={cat.category} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-sm font-semibold text-white">{cat.category}</h2>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.03)]">
              {cat.items.filter((item) => {
                if (searchQuery && !item.check.toLowerCase().includes(searchQuery.toLowerCase()) && !item.detail.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
              }).map((item, idx) => {
                const Icon = STATUS_ICONS[item.status];
                const colors = STATUS_COLORS[item.status];
                return (
                  <div key={idx} className="flex items-start gap-3 px-5 py-3">
                    <div className={`w-6 h-6 rounded-lg ${colors} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{item.check}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase shrink-0 ${item.status === 'passed' ? 'text-emerald-400' : item.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Plain Text Output</h2>
        <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
          <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
{`MONTHLY NEWSLETTER — July 2026

Welcome to this month's roundup from Digital Footprint.

We've been busy shipping new features across the platform.
Here's what's new:

• GuardianHub: Real-time alert correlation engine now live
• Synqoro: Multi-cloud deployment templates released
• QuickGuard: One-click security audits for all plans

Read the full update: https://digitalfootprint.uk/blog/july-2026

CTA: Explore New Features → https://digitalfootprint.uk/products

--- 

Digital Footprint Ltd
71-75 Shelton Street, London, WC2H 9JQ
Privacy: https://digitalfootprint.uk/privacy
Preferences: https://digitalfootprint.uk/email/preferences
Unsubscribe: https://digitalfootprint.uk/email/unsubscribe`}
          </pre>
        </div>
        <div className="mt-4 flex items-center gap-6">
          {[
            { label: 'Readable flow', status: 'passed' },
            { label: 'Working links', status: 'passed' },
            { label: 'Legal content', status: 'passed' },
            { label: 'No HTML residue', status: 'passed' },
            { label: 'Line length', status: 'warning', note: 'Some lines exceed 80 chars' },
            { label: 'Unsubscribe present', status: 'passed' },
          ].map((check) => (
            <div key={check.label} className="flex items-center gap-1.5">
              {check.status === 'passed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="text-[11px] text-slate-400">{check.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}