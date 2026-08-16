'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Monitor, Sparkles, FileText, Megaphone, Workflow, Repeat,
  Search, ChevronDown, Zap, CheckCircle2, Globe,
  Users, UserCog, ShieldCheck, Plus, Trash2, Info,
} from 'lucide-react';

const PRESETS = [
  { value: 'quick', label: 'Quick Check', description: '4 key email clients — fast results', icon: Zap, client_count: 4 },
  { value: 'core', label: 'Core Clients', description: '8 most-used email clients', icon: Monitor, client_count: 8 },
  { value: 'full', label: 'Full Compatibility', description: '16 clients across web, desktop & mobile', icon: ShieldCheck, client_count: 16 },
  { value: 'mobile', label: 'Mobile Only', description: 'iOS and Android email apps', icon: Monitor, client_count: 6 },
  { value: 'outlook', label: 'Outlook Focus', description: 'Outlook on Windows, Mac, Web & mobile', icon: Monitor, client_count: 5 },
  { value: 'dark_mode', label: 'Dark Mode', description: 'Dark mode across all supported clients', icon: Monitor, client_count: 6 },
  { value: 'images_blocked', label: 'Images Blocked', description: 'Test rendering with images disabled', icon: Monitor, client_count: 4 },
  { value: 'custom', label: 'Custom Matrix', description: 'Pick specific email clients manually', icon: Monitor, client_count: 0 },
];

const SOURCE_TYPES = [
  { value: 'template', label: 'Template', icon: FileText },
  { value: 'campaign', label: 'Campaign', icon: Megaphone },
  { value: 'automation', label: 'Automation', icon: Workflow },
  { value: 'transactional', label: 'Transactional', icon: Repeat },
];

const SAMPLE_PROFILES = [
  { id: '1', name: 'Default Profile', email: 'test@digital-footprint.uk' },
  { id: '2', name: 'German User', email: 'test-de@digital-footprint.uk' },
  { id: '3', name: 'Arabic RTL User', email: 'test-ar@digital-footprint.uk' },
  { id: '4', name: 'French User', email: 'test-fr@digital-footprint.uk' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
];

interface SourceOption {
  id: string;
  name: string;
  category: string;
}

export default function NewRenderTestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('template');
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('core');
  const [language, setLanguage] = useState('en');
  const [sampleProfile, setSampleProfile] = useState('1');
  const [testName, setTestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSources() {
      setSourcesLoading(true);
      setSelectedSource(null);
      let data: SourceOption[] = [];
      if (sourceType === 'template' || sourceType === 'transactional') {
        const res = await supabase.from('email_templates').select('id, name, category').order('name', { ascending: true }).limit(200);
        data = ((res.data || []) as Record<string, unknown>[]).map((t) => ({
          id: t.id as string,
          name: (t.name as string) || 'Untitled template',
          category: (t.category as string) || 'Template',
        }));
      } else if (sourceType === 'campaign') {
        const res = await supabase.from('email_campaigns').select('id, name').order('name', { ascending: true }).limit(200);
        data = ((res.data || []) as Record<string, unknown>[]).map((c) => ({
          id: c.id as string,
          name: (c.name as string) || 'Untitled campaign',
          category: 'Campaign',
        }));
      } else if (sourceType === 'automation') {
        const res = await supabase.from('email_automations').select('id, name').order('name', { ascending: true }).limit(200);
        data = ((res.data || []) as Record<string, unknown>[]).map((a) => ({
          id: a.id as string,
          name: (a.name as string) || 'Untitled automation',
          category: 'Automation',
        }));
      }
      if (!cancelled) {
        setSources(data);
        setSourcesLoading(false);
      }
    }
    loadSources();
    return () => { cancelled = true; };
  }, [sourceType]);

  const selectedProfile = SAMPLE_PROFILES.find((p) => p.id === sampleProfile);
  const selectedLanguage = LANGUAGES.find((l) => l.value === language);
  const selectedPresetData = PRESETS.find((p) => p.value === selectedPreset);

  const filteredSources = sources.filter((t) =>
    t.name.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedSource) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: testName.trim() || `${selectedSource.name} - Render Test`,
        source_type: sourceType,
        source_id: selectedSource.id,
        status: 'waiting',
        preset: selectedPreset,
        language,
        sample_profile: selectedProfile?.name || 'Default Profile',
        client_count: selectedPresetData?.client_count || 0,
        config: { source_type: sourceType, preset: selectedPreset, language },
      };
      const { data, error } = await supabase.from('email_render_tests').insert(payload).select('id');
      if (error) throw error;
      const id = data && data[0] ? (data[0] as { id: string }).id : null;
      if (id) {
        router.push(`/admin/email/render-tests/${id}`);
      } else {
        router.push('/admin/email/render-tests');
      }
    } catch {
      router.push('/admin/email/render-tests');
    }
  };

  const canGoNext = () => {
    if (step === 1) return !!selectedSource;
    if (step === 2) return !!selectedPreset && !!testName.trim();
    return true;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/render-tests" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">New Render Test</h1>
          <p className="text-xs text-slate-400 mt-0.5">Test email rendering across email clients and devices</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => { if (s <= step || (s === 2 && canGoNext())) setStep(s); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                step === s
                  ? 'bg-violet-400/10 text-violet-400 border border-violet-400/20'
                  : step > s
                  ? 'bg-emerald-400/5 text-emerald-400 border border-emerald-400/10'
                  : 'text-slate-500 border border-transparent'
              }`}
            >
              {step > s ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-violet-400 text-white' : 'bg-white/[0.06] text-slate-500'
                }`}>
                  {s}
                </span>
              )}
              {s === 1 ? 'Source' : s === 2 ? 'Configure' : 'Review'}
            </button>
            {s < 3 && <span className="w-8 h-px bg-[rgba(255,255,255,0.08)]" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              Select Source Type
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SOURCE_TYPES.map((st) => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.value}
                    onClick={() => { setSourceType(st.value); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                      sourceType === st.value
                        ? 'bg-violet-400/10 border-violet-400/30 text-violet-400'
                        : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:border-[rgba(255,255,255,0.12)] hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium whitespace-nowrap">{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-400" />
              Choose {SOURCE_TYPES.find((s) => s.value === sourceType)?.label}
            </h2>
            <div className="relative">
              <button
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white hover:border-violet-400/30 transition-all cursor-pointer"
              >
                {selectedSource ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{selectedSource.name}</span>
                    <span className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-white/[0.04] rounded-md">{selectedSource.category}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">Search and select a source...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${sourceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {sourceDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {sourcesLoading ? (
                      <p className="p-4 text-sm text-slate-500 text-center">Loading sources...</p>
                    ) : filteredSources.length > 0 ? (
                      filteredSources.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedSource(s); setSourceDropdownOpen(false); setTestName(`${s.name} - Render Test`); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors cursor-pointer ${
                            selectedSource?.id === s.id ? 'bg-violet-400/5 text-violet-400' : 'text-slate-300'
                          }`}
                        >
                          <FileText className={`w-4 h-4 shrink-0 ${selectedSource?.id === s.id ? 'text-violet-400' : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <p className="text-sm truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-500">{s.category}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-slate-500 text-center">No sources found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Continue
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Test Name
            </h2>
            <p className="text-xs text-slate-500 mb-3">Give this render test a descriptive name</p>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Welcome Email v3 — Core Clients"
              className="w-full px-4 py-3 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/30"
            />
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-violet-400" />
              Test Preset
            </h2>
            <p className="text-xs text-slate-500 mb-3">Choose which email clients to test against</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.value}
                    onClick={() => setSelectedPreset(preset.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPreset === preset.value
                        ? 'bg-violet-400/10 border-violet-400/30'
                        : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedPreset === preset.value ? 'bg-violet-400/20 text-violet-400' : 'bg-white/[0.04] text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${selectedPreset === preset.value ? 'text-violet-400' : 'text-white'}`}>
                        {preset.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
                      {preset.client_count > 0 && (
                        <span className="inline-block mt-1.5 text-[10px] font-medium text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md">
                          {preset.client_count} clients
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                Language
              </h2>
              <div className="relative">
                <button
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white hover:border-violet-400/30 transition-all cursor-pointer"
                >
                  <span>{selectedLanguage?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {languageDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => { setLanguage(lang.value); setLanguageDropdownOpen(false); }}
                        className={`w-full flex items-center px-4 py-2.5 text-sm text-left hover:bg-white/[0.04] transition-colors cursor-pointer ${
                          language === lang.value ? 'text-violet-400 bg-violet-400/5' : 'text-slate-300'
                        }`}
                      >
                        {lang.label}
                        <span className="ml-auto text-[10px] text-slate-500 uppercase">{lang.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-violet-400" />
                Sample Profile
              </h2>
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white hover:border-violet-400/30 transition-all cursor-pointer"
                >
                  <div className="text-left min-w-0">
                    <p className="text-sm truncate">{selectedProfile?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{selectedProfile?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    {SAMPLE_PROFILES.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => { setSampleProfile(prof.id); setProfileDropdownOpen(false); }}
                        className={`w-full flex flex-col px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors cursor-pointer ${
                          sampleProfile === prof.id ? 'text-violet-400 bg-violet-400/5' : 'text-slate-300'
                        }`}
                      >
                        <p className="text-sm">{prof.name}</p>
                        <p className="text-[10px] text-slate-500">{prof.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-medium text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Review
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              Review Test Configuration
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Test Name</span>
                <span className="text-sm font-medium text-white">{testName}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Source Type</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] text-xs font-medium text-slate-300">
                  {SOURCE_TYPES.find((s) => s.value === sourceType)?.label}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Source</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{selectedSource?.name}</p>
                  <p className="text-[10px] text-slate-500">{selectedSource?.category}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Preset</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                  selectedPreset === 'custom' ? 'text-amber-400 bg-amber-400/10' : 'text-violet-400 bg-violet-400/10'
                }`}>
                  {selectedPresetData?.label}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Email Clients</span>
                <span className="text-sm font-medium text-white">
                  {selectedPresetData?.client_count || 'Custom'} clients
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Language</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] text-xs font-medium text-slate-300">
                  <Globe className="w-3 h-3" />
                  {selectedLanguage?.label}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-slate-400">Sample Profile</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{selectedProfile?.name}</p>
                  <p className="text-[10px] text-slate-500">{selectedProfile?.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-violet-400/[0.03] border border-violet-400/10 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-violet-300 font-medium">Estimated time: {selectedPresetData?.client_count ? `${(selectedPresetData.client_count * 1.5).toFixed(0)}s` : 'varies'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Actual rendering time depends on client queue load and screenshot availability.
                </p>
              </div>
            </div>
          </div>

          {submitting && (
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Creating render test...</p>
                <p className="text-xs text-slate-500">Saving configuration and queueing for rendering</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-medium text-sm hover:bg-white/[0.08] transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {submitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Render Test
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}