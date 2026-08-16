'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  BrandKit, BrandKitColours, BrandKitTypography, BrandKitButtons, BrandKitLayout,
  BrandKitHeader, BrandKitFooter, BrandKitContact, BrandKitLogo, BrandSocialLink,
  defaultColours, defaultTypography, defaultButtons, defaultLayout,
  defaultHeader, defaultFooter, defaultContact, defaultLogo,
  SOCIAL_PLATFORMS,
} from '@/components/admin/email/editor/brand-types';
import {
  ArrowLeft, Save, Eye, AlertTriangle, Check, Info, Palette, Type,
  Layout, Image, Link2, Shield, Share2, Plus, Trash2, X,
  Sparkles, Globe,
} from 'lucide-react';

type Tab = 'overview' | 'logos' | 'colours' | 'typography' | 'buttons' | 'layout' | 'header' | 'footer' | 'contact' | 'social' | 'ai_voice' | 'locale_overrides' | 'preview';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: Info },
  { key: 'logos', label: 'Logos', icon: Image },
  { key: 'colours', label: 'Colours', icon: Palette },
  { key: 'typography', label: 'Typography', icon: Type },
  { key: 'buttons', label: 'Buttons', icon: Link2 },
  { key: 'layout', label: 'Email Layout', icon: Layout },
  { key: 'header', label: 'Header', icon: Layout },
  { key: 'footer', label: 'Footer', icon: Layout },
  { key: 'contact', label: 'Contact & Legal', icon: Shield },
  { key: 'social', label: 'Social Links', icon: Share2 },
  { key: 'ai_voice', label: 'AI Voice', icon: Sparkles },
  { key: 'locale_overrides', label: 'Locale Overrides', icon: Globe },
  { key: 'preview', label: 'Preview', icon: Eye },
];

function contrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const srgb = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  };
  const l1 = lum(hex1);
  const l2 = lum(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastWarning(fg: string, bg: string): string | null {
  if (!fg || !bg) return null;
  const ratio = contrastRatio(fg, bg);
  if (ratio < 4.5) return `Low contrast (${ratio.toFixed(1)}:1)`;
  return null;
}

function colourInput(label: string, value: string, onChange: (v: string) => void, warning?: string | null) {
  return (
    <div>
      <label className="text-[11px] font-medium text-slate-400 block mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.08)] cursor-pointer p-0 bg-transparent" />
        </div>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
      </div>
      {warning && <p className="text-[10px] text-amber-400 mt-1">{warning}</p>}
    </div>
  );
}

export default function BrandKitEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [feedback, setFeedback] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data, error } = await supabase.from('email_brand_kits').select('*').eq('id', id).maybeSingle();
      if (!error && data) setKit(data as BrandKit);
      setLoading(false);
    };
    fetch();
  }, [id, isNew]);

  const colours = kit?.colour_settings || defaultColours();
  const typography = kit?.typography_settings || defaultTypography();
  const buttons = kit?.button_settings || defaultButtons();
  const layout = kit?.layout_settings || defaultLayout();
  const header = kit?.header_settings || defaultHeader();
  const footer = kit?.footer_settings || defaultFooter();
  const contact = kit?.contact_settings || defaultContact();
  const logos = kit?.logo_settings || defaultLogo();
  const social = kit?.social_settings || [];

  const update = useCallback((field: string, value: unknown) => {
    setKit((prev) => {
      if (!prev && !isNew) return prev;
      const base = prev || {
        id: '', organisation_id: '', name: 'New Brand Kit', status: 'draft', is_default: false,
        product_name: null, description: null, website_domain: null,
        logo_settings: defaultLogo(), colour_settings: defaultColours(),
        typography_settings: defaultTypography(), button_settings: defaultButtons(),
        layout_settings: defaultLayout(), header_settings: defaultHeader(),
        footer_settings: defaultFooter(), contact_settings: defaultContact(),
        social_settings: [], ai_voice_settings: {}, locale_overrides: {}, created_by: null, updated_by: null,
        created_at: '', updated_at: '',
      };
      return { ...base, [field]: value, updated_at: new Date().toISOString() } as BrandKit;
    });
  }, [isNew]);

  const handleSave = async () => {
    if (!kit) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = { ...kit, updated_by: userData.user?.id ?? null, updated_at: new Date().toISOString() };

    if (isNew) {
      payload.created_by = userData.user?.id ?? null;
      const { data, error } = await supabase.from('email_brand_kits').insert(payload).select().single();
      if (!error && data) {
        setFeedback('Brand kit created');
        router.replace(`/admin/email/brand-kits/${data.id}`);
      } else {
        setFeedback('Failed to create brand kit');
      }
    } else {
      const { error } = await supabase.from('email_brand_kits').update(payload).eq('id', kit.id);
      if (!error) {
        setFeedback('Brand kit saved');
      } else {
        setFeedback('Failed to save');
      }
    }
    setSaving(false);
  };

  const handleActivate = async () => {
    if (!kit) return;
    const { error } = await supabase.from('email_brand_kits').update({ status: 'active' }).eq('id', kit.id);
    if (!error) {
      setKit({ ...kit, status: 'active' });
      setFeedback('Brand kit activated');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/email/brand-kits" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <input
              type="text"
              value={kit?.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-[rgba(255,255,255,0.1)] focus:border-[#06B6D4] focus:outline-none transition-colors px-1 py-0.5"
              placeholder="Brand Kit Name"
            />
            <p className="text-xs text-slate-500 mt-0.5">
              {kit?.status ? `${kit.status.charAt(0).toUpperCase() + kit.status.slice(1)}` : 'Draft'}
              {kit?.is_default ? ' · Default' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {kit?.status !== 'active' && (
            <button onClick={handleActivate} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-all cursor-pointer whitespace-nowrap">
              <Check className="w-4 h-4" /> Activate
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-2.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-xl text-sm text-[#06B6D4] flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-[#06B6D4]/70 hover:text-[#06B6D4] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5 sticky top-[73px]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Brand Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Brand Name</label>
                  <input type="text" value={kit?.name || ''} onChange={(e) => update('name', e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Product Name</label>
                  <input type="text" value={kit?.product_name || ''} onChange={(e) => update('product_name', e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Website Domain</label>
                  <input type="text" value={kit?.website_domain || ''} onChange={(e) => update('website_domain', e.target.value)} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" placeholder="example.com" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Status</label>
                  <div className="flex gap-1.5">
                    {(['draft', 'active', 'archived'] as const).map((s) => (
                      <button key={s} onClick={() => update('status', s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${kit?.status === s ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30' : 'text-slate-400 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Description</label>
                <textarea value={kit?.description || ''} onChange={(e) => update('description', e.target.value)} rows={3} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-none" />
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={kit?.is_default || false} onChange={(e) => update('is_default', e.target.checked)} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20" />
                  <span className="text-sm text-slate-300">Set as default brand kit</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'logos' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Logos</h3>
              <p className="text-xs text-slate-500 -mt-3">Upload or link brand logos for different contexts.</p>
              {(['primary', 'lightBg', 'darkBg', 'compactIcon', 'emailHeader', 'footerLogo'] as const).map((key) => (
                <div key={key} className="grid grid-cols-[1fr_2fr_120px] gap-4 items-start">
                  <span className="text-sm text-slate-300 pt-2">{key === 'primary' ? 'Primary Logo' : key === 'lightBg' ? 'Light Background' : key === 'darkBg' ? 'Dark Background' : key === 'compactIcon' ? 'Compact Icon' : key === 'emailHeader' ? 'Email Header' : 'Footer Logo'}</span>
                  <div>
                    <input type="text" value={logos[key] || ''} onChange={(e) => update('logo_settings', { ...logos, [key]: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" placeholder="https://..." />
                  </div>
                  <div className="w-[120px] h-[60px] bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg flex items-center justify-center">
                    {logos[key] ? <img src={logos[key]} alt="" className="max-w-full max-h-full object-contain p-2" /> : <span className="text-[10px] text-slate-600">No logo</span>}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Alt Text</label>
                <input type="text" value={logos.primaryAlt || ''} onChange={(e) => update('logo_settings', { ...logos, primaryAlt: e.target.value })} className="w-full max-w-md px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
            </div>
          )}

          {activeTab === 'colours' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Colours</h3>
              <div className="grid grid-cols-2 gap-4">
                {colourInput('Primary', colours.primary, (v) => update('colour_settings', { ...colours, primary: v }), contrastWarning(colours.headingText, colours.primary))}
                {colourInput('Secondary', colours.secondary, (v) => update('colour_settings', { ...colours, secondary: v }))}
                {colourInput('Accent', colours.accent, (v) => update('colour_settings', { ...colours, accent: v }))}
                {colourInput('Heading Text', colours.headingText, (v) => update('colour_settings', { ...colours, headingText: v }), contrastWarning(colours.headingText, colours.contentBg))}
                {colourInput('Body Text', colours.bodyText, (v) => update('colour_settings', { ...colours, bodyText: v }), contrastWarning(colours.bodyText, colours.contentBg))}
                {colourInput('Muted Text', colours.mutedText, (v) => update('colour_settings', { ...colours, mutedText: v }))}
                {colourInput('Link', colours.link, (v) => update('colour_settings', { ...colours, link: v }))}
                {colourInput('Button Text', colours.buttonText, (v) => update('colour_settings', { ...colours, buttonText: v }), contrastWarning(colours.buttonText, colours.primary))}
                {colourInput('Email Background', colours.emailBg, (v) => update('colour_settings', { ...colours, emailBg: v }))}
                {colourInput('Content Background', colours.contentBg, (v) => update('colour_settings', { ...colours, contentBg: v }))}
                {colourInput('Border', colours.border, (v) => update('colour_settings', { ...colours, border: v }))}
                {colourInput('Success', colours.success, (v) => update('colour_settings', { ...colours, success: v }))}
                {colourInput('Warning', colours.warning, (v) => update('colour_settings', { ...colours, warning: v }))}
                {colourInput('Error', colours.error, (v) => update('colour_settings', { ...colours, error: v }))}
              </div>
              <button onClick={() => update('colour_settings', defaultColours())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Typography</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Heading Font Stack</label>
                  <input type="text" value={typography.headingFont} onChange={(e) => update('typography_settings', { ...typography, headingFont: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Body Font Stack</label>
                  <input type="text" value={typography.bodyFont} onChange={(e) => update('typography_settings', { ...typography, bodyFont: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Body Size</label>
                  <input type="text" value={typography.bodySize} onChange={(e) => update('typography_settings', { ...typography, bodySize: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Heading Scale</label>
                  <input type="text" value={typography.headingScale} onChange={(e) => update('typography_settings', { ...typography, headingScale: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Line Height</label>
                  <input type="text" value={typography.lineHeight} onChange={(e) => update('typography_settings', { ...typography, lineHeight: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Default Weight</label>
                  <input type="text" value={typography.defaultWeight} onChange={(e) => update('typography_settings', { ...typography, defaultWeight: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Live Preview</p>
                <h2 className="font-bold mb-1" style={{ fontFamily: typography.headingFont, fontSize: typography.bodySize ? `${parseFloat(typography.bodySize) * parseFloat(typography.headingScale || '1.5')}px` : '21px', color: colours.headingText }}>
                  Heading Preview
                </h2>
                <p style={{ fontFamily: typography.bodyFont, fontSize: typography.bodySize, lineHeight: typography.lineHeight, color: colours.bodyText }}>
                  Body text preview showing the selected font stack, size and line height in action.
                </p>
              </div>
              <button onClick={() => update('typography_settings', defaultTypography())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'buttons' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Buttons</h3>
              <div className="grid grid-cols-2 gap-4">
                {colourInput('Primary Background', buttons.primaryBg, (v) => update('button_settings', { ...buttons, primaryBg: v }), contrastWarning(buttons.primaryText, buttons.primaryBg))}
                {colourInput('Secondary Background', buttons.secondaryBg, (v) => update('button_settings', { ...buttons, secondaryBg: v }), contrastWarning(buttons.secondaryText, buttons.secondaryBg))}
                {colourInput('Primary Text', buttons.primaryText, (v) => update('button_settings', { ...buttons, primaryText: v }))}
                {colourInput('Secondary Text', buttons.secondaryText, (v) => update('button_settings', { ...buttons, secondaryText: v }))}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Border Radius</label>
                  <input type="text" value={buttons.borderRadius} onChange={(e) => update('button_settings', { ...buttons, borderRadius: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Font Size</label>
                  <input type="text" value={buttons.fontSize} onChange={(e) => update('button_settings', { ...buttons, fontSize: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Font Weight</label>
                  <input type="text" value={buttons.fontWeight} onChange={(e) => update('button_settings', { ...buttons, fontWeight: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Horizontal Padding</label>
                  <input type="text" value={buttons.hPadding} onChange={(e) => update('button_settings', { ...buttons, hPadding: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Vertical Padding</label>
                  <input type="text" value={buttons.vPadding} onChange={(e) => update('button_settings', { ...buttons, vPadding: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={buttons.fullWidthMobile} onChange={(e) => update('button_settings', { ...buttons, fullWidthMobile: e.target.checked })} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20" />
                <span className="text-sm text-slate-300">Full width on mobile</span>
              </label>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider">Button Preview</p>
                <div className="flex gap-3">
                  <span className="inline-block rounded-lg font-bold cursor-default" style={{ backgroundColor: buttons.primaryBg, color: buttons.primaryText, borderRadius: buttons.borderRadius, padding: `${buttons.vPadding} ${buttons.hPadding}`, fontSize: buttons.fontSize, fontWeight: buttons.fontWeight }}>Primary Button</span>
                  <span className="inline-block rounded-lg font-bold cursor-default" style={{ backgroundColor: buttons.secondaryBg, color: buttons.secondaryText, borderRadius: buttons.borderRadius, padding: `${buttons.vPadding} ${buttons.hPadding}`, fontSize: buttons.fontSize, fontWeight: buttons.fontWeight }}>Secondary Button</span>
                </div>
              </div>
              <button onClick={() => update('button_settings', defaultButtons())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Email Layout</h3>
              <div className="grid grid-cols-2 gap-4">
                {colourInput('Outer Background', layout.outerBackground, (v) => update('layout_settings', { ...layout, outerBackground: v }))}
                {colourInput('Content Background', layout.contentBackground, (v) => update('layout_settings', { ...layout, contentBackground: v }))}
                {colourInput('Divider Colour', layout.dividerColour, (v) => update('layout_settings', { ...layout, dividerColour: v }))}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Email Width (px)</label>
                  <input type="number" value={layout.emailWidth} onChange={(e) => update('layout_settings', { ...layout, emailWidth: Number(e.target.value) })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Global Padding</label>
                  <input type="text" value={layout.globalPadding} onChange={(e) => update('layout_settings', { ...layout, globalPadding: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Section Spacing</label>
                  <input type="text" value={layout.sectionSpacing} onChange={(e) => update('layout_settings', { ...layout, sectionSpacing: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Mobile Padding</label>
                  <input type="text" value={layout.mobilePadding} onChange={(e) => update('layout_settings', { ...layout, mobilePadding: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Container Radius</label>
                  <input type="text" value={layout.containerRadius} onChange={(e) => update('layout_settings', { ...layout, containerRadius: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Image Radius</label>
                  <input type="text" value={layout.imageRadius} onChange={(e) => update('layout_settings', { ...layout, imageRadius: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <button onClick={() => update('layout_settings', defaultLayout())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'header' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Email Header</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Logo Style</label>
                  <div className="flex gap-1.5">
                    {(['centered', 'left', 'leftWithLink'] as const).map((t) => (
                      <button key={t} onClick={() => update('header_settings', { ...header, logoType: t })} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${header.logoType === t ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30' : 'text-slate-400 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'}`}>
                        {t === 'centered' ? 'Centered' : t === 'left' ? 'Left Logo' : 'Logo + Link'}
                      </button>
                    ))}
                  </div>
                </div>
                {colourInput('Background', header.backgroundColor, (v) => update('header_settings', { ...header, backgroundColor: v }))}
                {colourInput('Padding', header.padding, (v) => update('header_settings', { ...header, padding: v }))}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Logo Width</label>
                  <input type="text" value={header.logoWidth} onChange={(e) => update('header_settings', { ...header, logoWidth: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Website Link</label>
                  <input type="text" value={header.websiteLink} onChange={(e) => update('header_settings', { ...header, websiteLink: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={header.viewInBrowser} onChange={(e) => update('header_settings', { ...header, viewInBrowser: e.target.checked })} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20" />
                  <span className="text-sm text-slate-300">View in browser link</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={header.divider} onChange={(e) => update('header_settings', { ...header, divider: e.target.checked })} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20" />
                  <span className="text-sm text-slate-300">Show divider</span>
                </label>
              </div>
              <button onClick={() => update('header_settings', defaultHeader())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Email Footer</h3>
              <div className="grid grid-cols-2 gap-4">
                {colourInput('Background', footer.backgroundColor, (v) => update('footer_settings', { ...footer, backgroundColor: v }))}
                {colourInput('Text Colour', footer.textColor, (v) => update('footer_settings', { ...footer, textColor: v }), contrastWarning(footer.textColor, footer.backgroundColor))}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Public Name</label>
                  <input type="text" value={footer.publicName} onChange={(e) => update('footer_settings', { ...footer, publicName: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Legal Name</label>
                  <input type="text" value={footer.legalName} onChange={(e) => update('footer_settings', { ...footer, legalName: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Registered Office</label>
                  <input type="text" value={footer.registeredOffice} onChange={(e) => update('footer_settings', { ...footer, registeredOffice: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Company Number</label>
                  <input type="text" value={footer.companyNumber} onChange={(e) => update('footer_settings', { ...footer, companyNumber: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Support Email</label>
                  <input type="email" value={footer.supportEmail} onChange={(e) => update('footer_settings', { ...footer, supportEmail: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Website</label>
                  <input type="text" value={footer.website} onChange={(e) => update('footer_settings', { ...footer, website: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Privacy URL</label>
                  <input type="text" value={footer.privacyUrl} onChange={(e) => update('footer_settings', { ...footer, privacyUrl: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Unsubscribe Placeholder</label>
                  <input type="text" value={footer.unsubscribePlaceholder} onChange={(e) => update('footer_settings', { ...footer, unsubscribePlaceholder: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={footer.poweredByText} onChange={(e) => update('footer_settings', { ...footer, poweredByText: e.target.checked })} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20" />
                  <span className="text-sm text-slate-300">Powered by Digital Footprint</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={footer.divider} onChange={(e) => update('footer_settings', { ...footer, divider: e.target.checked })} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20" />
                  <span className="text-sm text-slate-300">Show divider</span>
                </label>
              </div>
              <button onClick={() => update('footer_settings', defaultFooter())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <h3 className="font-semibold text-white text-sm">Contact & Legal</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['publicName', 'legalName', 'registeredOffice', 'companyNumber', 'vatNumber', 'supportEmail', 'noreplyEmail', 'replyToEmail', 'telephone', 'website', 'privacyUrl', 'termsUrl', 'preferencesUrl', 'unsubscribePlaceholder'] as const).map((key) => (
                  <div key={key}>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                      {key === 'publicName' ? 'Public Name' : key === 'legalName' ? 'Legal Name' : key === 'registeredOffice' ? 'Registered Office' : key === 'companyNumber' ? 'Company Number' : key === 'vatNumber' ? 'VAT Number' : key === 'supportEmail' ? 'Support Email' : key === 'noreplyEmail' ? 'No-Reply Email' : key === 'replyToEmail' ? 'Reply-To Email' : key === 'telephone' ? 'Telephone' : key === 'website' ? 'Website' : key === 'privacyUrl' ? 'Privacy URL' : key === 'termsUrl' ? 'Terms URL' : key === 'preferencesUrl' ? 'Preferences URL' : 'Unsubscribe Placeholder'}
                    </label>
                    <input type={key.includes('Email') ? 'email' : 'text'} value={contact[key] || ''} onChange={(e) => update('contact_settings', { ...contact, [key]: e.target.value })} className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                  </div>
                ))}
              </div>
              <button onClick={() => update('contact_settings', defaultContact())} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Reset to defaults</button>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Social Links</h3>
                <button
                  onClick={() => update('social_settings', [...social, { platform: '', url: '', label: '', order: social.length, visible: true }])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#06B6D4] border border-[#06B6D4]/20 hover:bg-[#06B6D4]/10 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>
              {social.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No social links configured. Click &quot;Add Link&quot; to add one.</p>
              ) : (
                <div className="space-y-3">
                  {social.map((link: BrandSocialLink, idx: number) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 block mb-1">Platform</label>
                        <select
                          value={link.platform}
                          onChange={(e) => {
                            const next = [...social];
                            next[idx] = { ...next[idx], platform: e.target.value, label: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) };
                            update('social_settings', next);
                          }}
                          className="w-full px-2 py-1.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none pr-8"
                        >
                          <option value="">Select...</option>
                          {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 block mb-1">URL</label>
                        <input type="text" value={link.url} onChange={(e) => { const next = [...social]; next[idx] = { ...next[idx], url: e.target.value }; update('social_settings', next); }} className="w-full px-2 py-1.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                      </div>
                      <button
                        onClick={() => { const next = social.filter((_: BrandSocialLink, i: number) => i !== idx); update('social_settings', next); }}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors cursor-pointer mt-4"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai_voice' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AI Writing Voice</h3>
                  <p className="text-xs text-slate-500">Controls how the AI assistant writes content for this brand. Changes affect future generations only.</p>
                </div>
              </div>

              {[
                { key: 'tone_descriptors', label: 'Tone Descriptors', placeholder: 'e.g. Professional, warm, trustworthy, clear', hint: 'Comma-separated tone words that describe the brand voice' },
                { key: 'reading_level', label: 'Reading Level', placeholder: 'e.g. Grade 8, general audience, professional', hint: 'Target reading level for generated content' },
                { key: 'formality', label: 'Formality', placeholder: 'e.g. Semi-formal, conversational', hint: 'How formal or casual the writing should be' },
              ].map(field => {
                const voiceSettings = kit?.ai_voice_settings || {};
                const val = (voiceSettings as Record<string, unknown>)[field.key] || '';
                return (
                  <div key={field.key}>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={val as string}
                      onChange={(e) => update('ai_voice_settings', { ...voiceSettings, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">{field.hint}</p>
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'preferred_terms', label: 'Preferred Terms', placeholder: 'e.g. solutions, platform, empower', hint: 'Words to use (comma-separated)' },
                  { key: 'restricted_phrases', label: 'Terms to Avoid', placeholder: 'e.g. cheap, guarantee, free', hint: 'Words or phrases the AI should avoid' },
                ].map(field => {
                  const voiceSettings = kit?.ai_voice_settings || {};
                  const val = (voiceSettings as Record<string, unknown>)[field.key] || '';
                  return (
                    <div key={field.key}>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={val as string}
                        onChange={(e) => update('ai_voice_settings', { ...voiceSettings, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                      />
                      <p className="text-[10px] text-slate-600 mt-1">{field.hint}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'capitalization_rules', label: 'Capitalisation Rules', placeholder: 'e.g. sentence case for headings', hint: 'Preferred capitalisation for headings and body copy' },
                  { key: 'punctuation_guidance', label: 'Punctuation Guidance', placeholder: 'e.g. avoid exclamation marks', hint: 'Rules for punctuation in generated content' },
                ].map(field => {
                  const voiceSettings = kit?.ai_voice_settings || {};
                  const val = (voiceSettings as Record<string, unknown>)[field.key] || '';
                  return (
                    <div key={field.key}>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={val as string}
                        onChange={(e) => update('ai_voice_settings', { ...voiceSettings, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                      />
                      <p className="text-[10px] text-slate-600 mt-1">{field.hint}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'greeting_style', label: 'Greeting Style', placeholder: 'e.g. Hi {{first_name}},', hint: 'Preferred opening style for emails' },
                  { key: 'sign_off_style', label: 'Sign-off Style', placeholder: 'e.g. Best regards, The DFP Team', hint: 'Preferred closing style for emails' },
                  { key: 'max_subject_length', label: 'Max Subject Length', placeholder: 'e.g. 60', hint: 'Maximum recommended subject-line length' },
                  { key: 'max_paragraph_length', label: 'Max Paragraph Length', placeholder: 'e.g. 3 sentences', hint: 'Maximum recommended paragraph length' },
                ].map(field => {
                  const voiceSettings = kit?.ai_voice_settings || {};
                  const val = (voiceSettings as Record<string, unknown>)[field.key] || '';
                  return (
                    <div key={field.key}>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={val as string}
                        onChange={(e) => update('ai_voice_settings', { ...voiceSettings, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                      />
                      <p className="text-[10px] text-slate-600 mt-1">{field.hint}</p>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Compliance Notes</label>
                <textarea
                  value={((kit?.ai_voice_settings || {}) as Record<string, unknown>).compliance_notes as string || ''}
                  onChange={(e) => update('ai_voice_settings', { ...(kit?.ai_voice_settings || {}), compliance_notes: e.target.value })}
                  rows={3} maxLength={500}
                  placeholder="e.g. Never mention competitors. Must include unsubscribe. No health claims."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Example Approved Copy</label>
                <textarea
                  value={((kit?.ai_voice_settings || {}) as Record<string, unknown>).example_copy as string || ''}
                  onChange={(e) => update('ai_voice_settings', { ...(kit?.ai_voice_settings || {}), example_copy: e.target.value })}
                  rows={4} maxLength={1000}
                  placeholder="Paste an example of approved copy that represents the ideal brand tone..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y"
                />
              </div>

              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-300">AI Voice Settings</p>
                    <p className="text-[10px] text-amber-400/70 mt-0.5">
                      These settings guide the AI assistant but do not guarantee output. AI-generated content always requires human review before use. The AI will never invent claims, prices, guarantees, addresses, or legal information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'locale_overrides' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Locale Overrides</h3>
                  <p className="text-xs text-slate-500">Set locale-specific content for footer, legal, links and sender details. Colours and layout are inherited from the base brand.</p>
                </div>
              </div>

              {['en-GB', 'fr-FR', 'de-DE', 'es-ES', 'ar-SA'].map(locale => {
                const localeOverrides = (kit?.locale_overrides as Record<string, Record<string, string>>) || {};
                const loc = localeOverrides[locale] || {};
                const label: Record<string, string> = { 'en-GB': 'English (UK)', 'fr-FR': 'French (France)', 'de-DE': 'German (Germany)', 'es-ES': 'Spanish (Spain)', 'ar-SA': 'Arabic (Saudi Arabia)' };
                const isRtl = locale.startsWith('ar') || locale.startsWith('he');
                const hasContent = Object.values(loc).some(v => v);

                return (
                  <div key={locale} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{label[locale] || locale}</span>
                        {isRtl && <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-bold">RTL</span>}
                        {hasContent && <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">Configured</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'publicName', label: 'Public Name' },
                        { key: 'legalName', label: 'Legal Name' },
                        { key: 'registeredOffice', label: 'Registered Office' },
                        { key: 'privacyUrl', label: 'Privacy URL' },
                        { key: 'termsUrl', label: 'Terms URL' },
                        { key: 'preferencesUrl', label: 'Preferences URL' },
                        { key: 'supportEmail', label: 'Support Email' },
                        { key: 'unsubscribeText', label: 'Unsubscribe Text' },
                        { key: 'defaultCta', label: 'Default CTA' },
                        { key: 'socialLabel', label: 'Social Label' },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="text-[10px] text-slate-500 mb-0.5 block">{field.label}</label>
                          <input
                            type="text"
                            value={loc[field.key] || ''}
                            onChange={e => {
                              const updatedLoc = { ...loc, [field.key]: e.target.value };
                              const updatedOverrides = { ...localeOverrides, [locale]: updatedLoc };
                              const othersHaveContent = Object.entries(updatedLoc).some(([k, v]) => k !== field.key && v);
                              if (!e.target.value && !othersHaveContent) {
                                const remaining = { ...updatedOverrides };
                                delete remaining[locale];
                                update('locale_overrides', Object.keys(remaining).length > 0 ? remaining : null);
                              } else {
                                update('locale_overrides', updatedOverrides);
                              }
                            }}
                            placeholder="Inherits from base brand"
                            className="w-full px-2 py-1.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-300">Locale Override Behaviour</p>
                    <p className="text-[10px] text-amber-400/70 mt-0.5">
                      Empty fields inherit from the base brand settings. Colours, typography, layout and logos are always inherited. Only text content and URLs can be overridden per locale. RTL languages will automatically use appropriate text alignment and spacing during rendering.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Brand Preview</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg p-0.5">
                    <button onClick={() => setPreviewDevice('desktop')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${previewDevice === 'desktop' ? 'bg-white/[0.06] text-white' : 'text-slate-500'}`}>Desktop</button>
                    <button onClick={() => setPreviewDevice('mobile')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${previewDevice === 'mobile' ? 'bg-white/[0.06] text-white' : 'text-slate-500'}`}>Mobile</button>
                  </div>
                  <div className="flex items-center gap-1 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg p-0.5">
                    <button onClick={() => setPreviewBg('light')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${previewBg === 'light' ? 'bg-white/[0.06] text-white' : 'text-slate-500'}`}>Light</button>
                    <button onClick={() => setPreviewBg('dark')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${previewBg === 'dark' ? 'bg-white/[0.06] text-white' : 'text-slate-500'}`}>Dark</button>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border-2 ${previewBg === 'dark' ? 'bg-[#1a1a2e] border-slate-700' : 'bg-slate-100 border-slate-200'} p-6 flex justify-center`}>
                <div style={{ width: previewDevice === 'mobile' ? 375 : 600, maxWidth: '100%' }}>
                  <div style={{ backgroundColor: layout.contentBackground, borderRadius: layout.containerRadius, overflow: 'hidden', border: layout.border, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

                    {logos.primary && (
                      <div style={{ backgroundColor: header.backgroundColor, padding: header.padding, textAlign: header.logoType === 'centered' ? 'center' : 'left', borderBottom: header.divider ? `1px solid ${colours.border}` : 'none' }}>
                        <img src={logos.primary} alt={(logos as BrandKitLogo).primaryAlt || 'Logo'} style={{ width: header.logoWidth, maxWidth: '100%', height: 'auto', display: header.logoType === 'centered' ? 'inline-block' : 'block' }} />
                      </div>
                    )}

                    <div style={{ padding: layout.globalPadding }}>
                      <h2 style={{ fontFamily: typography.headingFont, fontSize: typography.bodySize ? `${parseFloat(typography.bodySize) * parseFloat(typography.headingScale || '1.5')}px` : '21px', fontWeight: 'bold', color: colours.headingText, marginBottom: '12px' }}>
                        Brand Preview
                      </h2>
                      <p style={{ fontFamily: typography.bodyFont, fontSize: typography.bodySize, lineHeight: typography.lineHeight, color: colours.bodyText, marginBottom: '16px' }}>
                        This preview shows how your brand styling applies to email content. Text, buttons, and layout follow your brand settings.
                      </p>
                      <p style={{ marginBottom: '16px' }}>
                        <a href="#" style={{ color: colours.link, fontFamily: typography.bodyFont, fontSize: typography.bodySize }}>Sample link text</a>
                      </p>
                      <div style={{ marginBottom: '16px' }}>
                        <a href="#" style={{ display: 'inline-block', backgroundColor: buttons.primaryBg, color: buttons.primaryText, borderRadius: buttons.borderRadius, padding: `${buttons.vPadding} ${buttons.hPadding}`, fontSize: buttons.fontSize, fontWeight: buttons.fontWeight, textDecoration: 'none', textAlign: 'center' }}>
                          Primary Button
                        </a>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <a href="#" style={{ display: 'inline-block', backgroundColor: buttons.secondaryBg, color: buttons.secondaryText, borderRadius: buttons.borderRadius, padding: `${buttons.vPadding} ${buttons.hPadding}`, fontSize: buttons.fontSize, fontWeight: buttons.fontWeight, textDecoration: 'none', textAlign: 'center' }}>
                          Secondary Button
                        </a>
                      </div>
                      {logos.primary && (
                        <div style={{ marginBottom: '16px' }}>
                          <img src={logos.primary} alt="" style={{ maxWidth: '100%', height: 'auto', borderRadius: layout.imageRadius }} />
                        </div>
                      )}
                      <div style={{ backgroundColor: colours.secondary + '10', borderRadius: layout.containerRadius, padding: layout.globalPadding, border: `1px solid ${colours.border}`, marginBottom: '16px' }}>
                        <p style={{ fontFamily: typography.bodyFont, fontSize: typography.bodySize, fontWeight: 'bold', color: colours.headingText, margin: '0 0 4px' }}>Feature Card</p>
                        <p style={{ fontFamily: typography.bodyFont, fontSize: typography.bodySize, color: colours.mutedText, margin: 0 }}>Cards use your brand styling for consistent presentation.</p>
                      </div>
                      <hr style={{ border: 'none', borderTop: `1px solid ${colours.border}`, margin: `${layout.sectionSpacing} 0` }} />
                    </div>

                    <div style={{ backgroundColor: footer.backgroundColor, padding: footer.padding, textAlign: footer.alignment as 'left' | 'center' | 'right', borderTop: footer.divider ? `1px solid ${colours.border}` : 'none' }}>
                      {footer.showLogo && logos.primary && <img src={logos.primary} alt="" style={{ width: '100px', maxWidth: '100%', height: 'auto', marginBottom: '12px', display: 'inline-block' }} />}
                      {footer.publicName && <p style={{ fontFamily: typography.bodyFont, fontSize: '12px', color: footer.textColor, margin: '0 0 4px', fontWeight: 'bold' }}>{footer.publicName}</p>}
                      {footer.registeredOffice && <p style={{ fontFamily: typography.bodyFont, fontSize: '11px', color: footer.textColor, margin: '0 0 4px' }}>{footer.registeredOffice}</p>}
                      {footer.companyNumber && <p style={{ fontFamily: typography.bodyFont, fontSize: '11px', color: footer.textColor, margin: '0 0 4px' }}>Company No: {footer.companyNumber}</p>}
                      <p style={{ fontFamily: typography.bodyFont, fontSize: '11px', color: footer.textColor, margin: '12px 0 0' }}>
                        <a href={footer.unsubscribePlaceholder} style={{ color: footer.textColor }}>Unsubscribe</a>
                        {footer.privacyUrl && <> &middot; <a href={footer.privacyUrl} style={{ color: footer.textColor }}>Privacy</a></>}
                      </p>
                      {footer.poweredByText && <p style={{ fontFamily: typography.bodyFont, fontSize: '10px', color: footer.textColor, margin: '8px 0 0', opacity: 0.6 }}>Powered and managed by Digital Footprint</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
