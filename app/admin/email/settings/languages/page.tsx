'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Globe, ArrowLeft, Save, Plus, Trash2, Check, AlertTriangle,
  RefreshCw, ChevronDown, ExternalLink, Info,
} from 'lucide-react';

interface LanguageConfig {
  sourceLanguage: string;
  enabledLanguages: { code: string; locale: string; label: string; rtl: boolean }[];
  fallbackLanguage: string;
  brandLanguageAvailability: { brandId: string; brandName: string; languages: string[] }[];
  requiredReviewerRoles: string[];
  translationProviderStatus: string;
  localisedLegalRequired: string[];
}

const LANGUAGES: { code: string; label: string; locale: string; rtl: boolean }[] = [
  { code: 'en', label: 'English', locale: 'en-GB', rtl: false },
  { code: 'fr', label: 'French', locale: 'fr-FR', rtl: false },
  { code: 'de', label: 'German', locale: 'de-DE', rtl: false },
  { code: 'es', label: 'Spanish', locale: 'es-ES', rtl: false },
  { code: 'it', label: 'Italian', locale: 'it-IT', rtl: false },
  { code: 'pt', label: 'Portuguese', locale: 'pt-PT', rtl: false },
  { code: 'nl', label: 'Dutch', locale: 'nl-NL', rtl: false },
  { code: 'pl', label: 'Polish', locale: 'pl-PL', rtl: false },
  { code: 'ar', label: 'Arabic', locale: 'ar-SA', rtl: true },
  { code: 'he', label: 'Hebrew', locale: 'he-IL', rtl: true },
  { code: 'ja', label: 'Japanese', locale: 'ja-JP', rtl: false },
  { code: 'zh', label: 'Chinese (Simplified)', locale: 'zh-CN', rtl: false },
  { code: 'ko', label: 'Korean', locale: 'ko-KR', rtl: false },
  { code: 'sv', label: 'Swedish', locale: 'sv-SE', rtl: false },
  { code: 'da', label: 'Danish', locale: 'da-DK', rtl: false },
  { code: 'no', label: 'Norwegian', locale: 'nb-NO', rtl: false },
  { code: 'fi', label: 'Finnish', locale: 'fi-FI', rtl: false },
  { code: 'tr', label: 'Turkish', locale: 'tr-TR', rtl: false },
  { code: 'ru', label: 'Russian', locale: 'ru-RU', rtl: false },
  { code: 'uk', label: 'Ukrainian', locale: 'uk-UA', rtl: false },
  { code: 'hi', label: 'Hindi', locale: 'hi-IN', rtl: false },
  { code: 'th', label: 'Thai', locale: 'th-TH', rtl: false },
  { code: 'vi', label: 'Vietnamese', locale: 'vi-VN', rtl: false },
];

const REVIEWER_ROLES = [
  'Administrator', 'Email Operations Owner', 'Compliance Owner',
  'Approver', 'Reviewer', 'Technical Owner', 'Product Owner',
];

const REQUIRED_LEGAL = [
  'company_identity', 'registered_details', 'privacy_link',
  'preference_link', 'unsubscribe_text', 'promotional_conditions',
  'legal_notices',
];

export default function LanguageSettingsPage() {
  const [config, setConfig] = useState<LanguageConfig>({
    sourceLanguage: 'en',
    enabledLanguages: [{ code: 'en', locale: 'en-GB', label: 'English', rtl: false }],
    fallbackLanguage: 'en',
    brandLanguageAvailability: [],
    requiredReviewerRoles: ['Administrator', 'Compliance Owner'],
    translationProviderStatus: 'unconfigured',
    localisedLegalRequired: ['company_identity', 'privacy_link', 'preference_link', 'unsubscribe_text'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [showAddLang, setShowAddLang] = useState(false);
  const [selectedAddLang, setSelectedAddLang] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: settings } = await supabase.from('email_studio_settings').select('language_config').maybeSingle();
    if (settings?.language_config && typeof settings.language_config === 'object') {
      const saved = settings.language_config as Record<string, unknown>;
      setConfig({
        sourceLanguage: (saved.sourceLanguage as string) || 'en',
        enabledLanguages: (saved.enabledLanguages as LanguageConfig['enabledLanguages']) || [{ code: 'en', locale: 'en-GB', label: 'English', rtl: false }],
        fallbackLanguage: (saved.fallbackLanguage as string) || 'en',
        brandLanguageAvailability: (saved.brandLanguageAvailability as LanguageConfig['brandLanguageAvailability']) || [],
        requiredReviewerRoles: (saved.requiredReviewerRoles as string[]) || ['Administrator', 'Compliance Owner'],
        translationProviderStatus: (saved.translationProviderStatus as string) || 'unconfigured',
        localisedLegalRequired: (saved.localisedLegalRequired as string[]) || ['company_identity', 'privacy_link', 'preference_link', 'unsubscribe_text'],
      });
    }
    const { data: brandData } = await supabase.from('email_brand_kits').select('id, name').order('name');
    if (brandData) setBrands(brandData as { id: string; name: string }[]);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();
    if (existing) {
      await supabase.from('email_studio_settings').update({
        language_config: config as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('email_studio_settings').insert({
        language_config: config as unknown as Record<string, unknown>,
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addLanguage = (code: string) => {
    if (config.enabledLanguages.find(l => l.code === code)) return;
    const lang = LANGUAGES.find(l => l.code === code);
    if (!lang) return;
    setConfig(prev => ({
      ...prev,
      enabledLanguages: [...prev.enabledLanguages, lang],
      brandLanguageAvailability: prev.brandLanguageAvailability.map(b => ({
        ...b,
        languages: b.languages.includes(code) ? b.languages : [...b.languages, code],
      })),
    }));
    setShowAddLang(false);
    setSelectedAddLang('');
  };

  const removeLanguage = (code: string) => {
    if (code === config.sourceLanguage) return;
    setConfig(prev => ({
      ...prev,
      enabledLanguages: prev.enabledLanguages.filter(l => l.code !== code),
      fallbackLanguage: prev.fallbackLanguage === code ? prev.sourceLanguage : prev.fallbackLanguage,
      brandLanguageAvailability: prev.brandLanguageAvailability.map(b => ({
        ...b,
        languages: b.languages.filter(l => l !== code),
      })),
    }));
  };

  const toggleBrandLanguage = (brandId: string, brandName: string, code: string) => {
    setConfig(prev => {
      const existing = prev.brandLanguageAvailability.find(b => b.brandId === brandId);
      let updated: typeof prev.brandLanguageAvailability;
      if (existing) {
        updated = prev.brandLanguageAvailability.map(b =>
          b.brandId === brandId
            ? { ...b, languages: b.languages.includes(code) ? b.languages.filter(l => l !== code) : [...b.languages, code] }
            : b
        );
      } else {
        updated = [...prev.brandLanguageAvailability, { brandId, brandName, languages: [code] }];
      }
      return { ...prev, brandLanguageAvailability: updated };
    });
  };

  const toggleReviewerRole = (role: string) => {
    setConfig(prev => ({
      ...prev,
      requiredReviewerRoles: prev.requiredReviewerRoles.includes(role)
        ? prev.requiredReviewerRoles.filter(r => r !== role)
        : [...prev.requiredReviewerRoles, role],
    }));
  };

  const toggleLegalReq = (item: string) => {
    setConfig(prev => ({
      ...prev,
      localisedLegalRequired: prev.localisedLegalRequired.includes(item)
        ? prev.localisedLegalRequired.filter(l => l !== item)
        : [...prev.localisedLegalRequired, item],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Language & Localisation Settings</h1>
            <p className="text-sm text-slate-400 mt-0.5">Configure supported languages, fallbacks, reviewer requirements and legal content rules.</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Core Language Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Default Source Language</label>
                <select value={config.sourceLanguage} onChange={e => setConfig(prev => ({ ...prev, sourceLanguage: e.target.value }))}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label} ({l.locale})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-600 mt-1">The language all original content is written in. AI and machine translations translate from this language.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Fallback Language</label>
                <select value={config.fallbackLanguage} onChange={e => setConfig(prev => ({ ...prev, fallbackLanguage: e.target.value }))}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
                >
                  {config.enabledLanguages.map(l => (
                    <option key={l.code} value={l.code}>{l.label} ({l.locale}){l.rtl ? ' [RTL]' : ''}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-600 mt-1">Used when a recipient has no language preference or a requested language is unavailable.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Translation Provider</label>
                <div className="flex items-center gap-2">
                  <select value={config.translationProviderStatus} onChange={e => setConfig(prev => ({ ...prev, translationProviderStatus: e.target.value }))}
                    className="flex-1 pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
                  >
                    <option value="unconfigured">Not configured</option>
                    <option value="ai_assistant">AI Assistant (reuse Prompt 16 adapter)</option>
                    <option value="external">External translation provider</option>
                    <option value="manual_only">Manual translations only</option>
                  </select>
                  <Link href="/admin/email/settings/ai" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-500 hover:text-[#06B6D4] transition-all cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Enabled Languages</h2>
              <button onClick={() => setShowAddLang(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Language
              </button>
            </div>

            <div className="space-y-2">
              {config.enabledLanguages.map(lang => (
                <div key={lang.code} className="flex items-center justify-between p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{lang.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{lang.locale}</span>
                    {lang.rtl && <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-bold">RTL</span>}
                    {lang.code === config.sourceLanguage && <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Source</span>}
                    {lang.code === config.fallbackLanguage && <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold">Fallback</span>}
                  </div>
                  <button
                    onClick={() => removeLanguage(lang.code)}
                    disabled={lang.code === config.sourceLanguage}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {showAddLang && (
              <div className="mt-3 flex items-center gap-2">
                <select value={selectedAddLang} onChange={e => setSelectedAddLang(e.target.value)}
                  className="flex-1 pl-3 pr-8 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
                >
                  <option value="">Select language...</option>
                  {LANGUAGES.filter(l => !config.enabledLanguages.find(el => el.code === l.code)).map(l => (
                    <option key={l.code} value={l.code}>{l.label} ({l.locale}){l.rtl ? ' [RTL]' : ''}</option>
                  ))}
                </select>
                <button onClick={() => selectedAddLang && addLanguage(selectedAddLang)}
                  disabled={!selectedAddLang}
                  className="px-3 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >Add</button>
                <button onClick={() => { setShowAddLang(false); setSelectedAddLang(''); }}
                  className="px-2 py-2 text-slate-500 hover:text-white cursor-pointer"
                >Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Review & Approval Requirements</h2>
            <p className="text-xs text-slate-500 mb-4">Roles that can approve translations and legal content. Translators cannot approve their own work when separation of duties is enabled.</p>

            <div className="space-y-1.5">
              {REVIEWER_ROLES.map(role => {
                const isRequired = config.requiredReviewerRoles.includes(role);
                return (
                  <button key={role} onClick={() => toggleReviewerRole(role)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all cursor-pointer ${
                      isRequired ? 'bg-[#06B6D4]/5 border border-[#06B6D4]/20 text-white' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.04)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRequired ? 'bg-[#06B6D4] border-[#06B6D4]' : 'border-[rgba(255,255,255,0.15)]'}`}>
                      {isRequired && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span>{role}</span>
                    {isRequired && <span className="ml-auto text-[10px] text-[#06B6D4]">Reviewer</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Required Localised Legal Content</h2>
            <p className="text-xs text-slate-500 mb-4">Each enabled marketing locale must have approved localised versions of these items before activation.</p>

            <div className="space-y-1.5">
              {REQUIRED_LEGAL.map(item => {
                const isRequired = config.localisedLegalRequired.includes(item);
                return (
                  <button key={item} onClick={() => toggleLegalReq(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                      isRequired ? 'bg-amber-500/5 border border-amber-500/15 text-amber-300' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.04)] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRequired ? 'bg-amber-500/30 border-amber-500/50' : 'border-[rgba(255,255,255,0.15)]'}`}>
                      {isRequired && <Check className="w-2.5 h-2.5 text-amber-400" />}
                    </div>
                    <span className="capitalize">{item.replace(/_/g, ' ')}</span>
                    {isRequired && <span className="ml-auto text-[10px] text-amber-400">Required</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Brand Language Availability</h2>
            <p className="text-xs text-slate-500 mb-4">Specify which brands support which languages. Templates and campaigns can only use languages declared here for each brand.</p>

            {brands.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">No brand kits configured. <Link href="/admin/email/brand-kits" className="text-[#06B6D4] hover:underline cursor-pointer">Create one</Link>.</p>
            ) : (
              <div className="space-y-3">
                {brands.map(brand => {
                  const avail = config.brandLanguageAvailability.find(b => b.brandId === brand.id);
                  const brandLangs = avail?.languages || config.enabledLanguages.map(l => l.code);
                  return (
                    <div key={brand.id} className="p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white">{brand.name}</span>
                        <span className="text-[10px] text-slate-500">{brandLangs.length} language(s)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {config.enabledLanguages.map(lang => {
                          const active = brandLangs.includes(lang.code);
                          return (
                            <button key={lang.code} onClick={() => toggleBrandLanguage(brand.id, brand.name, lang.code)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                                active ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/25' : 'bg-white/[0.02] text-slate-600 border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]'
                              }`}
                            >
                              {lang.code.toUpperCase()}{lang.rtl ? ' RTL' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Language Configuration Notes</p>
            <ul className="text-xs text-amber-400/70 mt-1 space-y-0.5 list-disc list-inside">
              <li>Machine translations are always marked as drafts and require human review.</li>
              <li>Legal content in translated locales requires an authorised reviewer before activation.</li>
              <li>Outdated translations (where source has changed) are flagged but never auto-replaced.</li>
              <li>RTL languages use appropriate direction attributes and mirrored spacing.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}