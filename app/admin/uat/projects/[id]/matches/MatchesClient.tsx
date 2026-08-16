'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import { calculateMatchResult, scoreBugReport } from '@/lib/uat-matching';
import type { ProjectMatchingRequirements, TesterMatchResult, MatchingDimension, SuitabilityLabel, MatchingProfile } from '@/lib/uat-application-types';
import {
  Search, Loader2, Star, AlertTriangle, CheckCircle2, UserPlus,
  ArrowLeft, Filter, X, BarChart3, Tag, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

const SUITABILITY_COLORS: Record<SuitabilityLabel, string> = {
  'Excellent match': '#10B981',
  'Strong match': '#06B6D4',
  'Possible match': '#F59E0B',
  'Manual review': '#8B5CF6',
  'Does not meet required criteria': '#EF4444',
};

export default function MatchesClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [testers, setTesters] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('all');
  const [requirements, setRequirements] = useState<ProjectMatchingRequirements>({
    required: { deviceTypes: [], browsers: [], testingActivities: [], maxTesterCount: 10 },
    preferred: { industries: [], devices: [], userPerspectives: [] },
  });
  const [showRequirementsPanel, setShowRequirementsPanel] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: proj } = await supabase.from('uat_projects').select('*').eq('id', projectId).maybeSingle();
    setProject(proj);

    const { data: reqs } = await supabase.from('uat_project_matching_requirements').select('*').eq('project_id', projectId).maybeSingle();
    if (reqs) {
      setRequirements({
        required: reqs.requirements_json || { deviceTypes: [], browsers: [], testingActivities: [], maxTesterCount: 10 },
        preferred: reqs.preferred_json || { industries: [], devices: [], userPerspectives: [] },
      });
    }

    const { data: apps } = await supabase.from('uat_tester_applications').select('*').eq('status', 'approved');
    setTesters(apps || []);

    const { data: existingMatches } = await supabase.from('uat_tester_match_results').select('*').eq('project_id', projectId);
    if (existingMatches && existingMatches.length > 0) {
      setMatches(existingMatches);
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runMatching = async () => {
    setCalculating(true);
    try {
      await supabase.from('uat_project_matching_requirements').upsert({
        project_id: projectId,
        requirements_json: requirements.required,
        preferred_json: requirements.preferred,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id' });

      const results: any[] = [];
      for (const tester of testers) {
        const appData = tester.application_data || {};
        const profile: MatchingProfile = {
          experienceLevel: appData.experienceLevel || '',
          industryConfidence: Object.fromEntries(
            (appData.industryExperience || []).map((ie: any) => [ie.industry?.toLowerCase().replace(/\s+/g, '-') || '', ie.confidence || ''])
          ),
          bugReportScore: tester.practical_bug_report_score ?? scoreBugReport(appData.practicalBugReport),
          deviceCoverage: (appData.devices || []).map((d: string) => d.toLowerCase().replace(/\s+/g, '-')),
          browserCoverage: appData.browsers || [],
          testingActivities: appData.testingActivities || [],
          preferredDifficulty: appData.preferredTestingLevel || '',
          accessibilityCapability: appData.accessibilityCapabilities || [],
          availabilityHours: appData.availabilityHours || '',
          responseSpeed: appData.responseSpeed || '',
          communicationMethods: appData.communicationMethods || [],
          conflictFlag: appData.projectConflictStatus === 'Yes',
          trainingNeeds: appData.experienceLevel === 'Complete beginner' ? ['intro-training'] : [],
          currentAssignmentLoad: 0,
        };

        const result = calculateMatchResult(profile, requirements);
        results.push({
          project_id: projectId,
          tester_id: tester.user_id,
          dimension_scores: result.dimensionScores,
          suitability_label: result.suitabilityLabel,
          explanation_json: result.explanation,
          missing_requirements: result.missingRequirements,
          calculated_at: new Date().toISOString(),
          tester_name: tester.legal_name || appData.legalName || 'Unnamed',
          tester_email: tester.email,
          tester_devices: appData.devices || [],
          tester_tags: tester.generated_tags || [],
          tester_bug_score: tester.practical_bug_report_score ?? scoreBugReport(appData.practicalBugReport),
          tester_experience: appData.experienceLevel || '',
          tester_conflict: appData.projectConflictStatus === 'Yes',
        });
      }

      results.sort((a, b) => {
        const order: Record<string, number> = { 'Excellent match': 0, 'Strong match': 1, 'Possible match': 2, 'Manual review': 3, 'Does not meet required criteria': 4 };
        const oa = order[a.suitability_label] ?? 5;
        const ob = order[b.suitability_label] ?? 5;
        if (oa !== ob) return oa - ob;
        const avgA = Object.values(a.dimension_scores as Record<string, number>).reduce((x: number, y: number) => x + y, 0) / 7;
        const avgB = Object.values(b.dimension_scores as Record<string, number>).reduce((x: number, y: number) => x + y, 0) / 7;
        return avgB - avgA;
      });

      for (const r of results) {
        await supabase.from('uat_tester_match_results').upsert({
          project_id: r.project_id,
          tester_id: r.tester_id,
          dimension_scores: r.dimension_scores,
          suitability_label: r.suitability_label,
          explanation_json: r.explanation_json,
          missing_requirements: r.missing_requirements,
          calculated_at: r.calculated_at,
        }, { onConflict: 'project_id,tester_id' });
      }

      setMatches(results);
    } catch {}
    setCalculating(false);
  };

  const filteredMatches = matches.filter((m) => {
    if (labelFilter !== 'all' && m.suitability_label !== labelFilter) return false;
    if (searchFilter) {
      const s = searchFilter.toLowerCase();
      return (m.tester_name || '').toLowerCase().includes(s) || (m.tester_email || '').toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 text-[#06B6D4] animate-spin" /></div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/uat/projects/${projectId}`} className="text-slate-400 hover:text-white transition cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Project Matching</p>
            <h1 className="text-2xl font-bold text-white mt-1">{project?.name || 'Project'} — Tester Matches</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={runMatching}
            disabled={calculating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            {matches.length > 0 ? 'Re-run Matching' : 'Calculate Matches'}
          </button>

          <button
            onClick={() => setShowRequirementsPanel(!showRequirementsPanel)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition cursor-pointer whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            Matching Requirements
            <ChevronDown className={`h-3.5 w-3.5 transition ${showRequirementsPanel ? 'rotate-180' : ''}`} />
          </button>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Search testers..." className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition" />
          </div>

          <div className="flex gap-1.5">
            {['all', 'Excellent match', 'Strong match', 'Possible match', 'Manual review', 'Does not meet required criteria'].map((label) => (
              <button
                key={label}
                onClick={() => setLabelFilter(label)}
                className={`px-3 py-2 rounded-lg text-[10px] font-semibold border transition cursor-pointer whitespace-nowrap ${
                  labelFilter === label
                    ? 'border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4]'
                    : 'border-[rgba(255,255,255,0.08)] text-slate-500 hover:text-slate-300'
                }`}
              >
                {label === 'all' ? 'All' : label}
              </button>
            ))}
          </div>
        </div>

        {showRequirementsPanel && (
          <RequirementsPanel requirements={requirements} setRequirements={setRequirements} />
        )}

        {matches.length === 0 && !calculating ? (
          <div className="text-center py-20 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
            <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No matches calculated yet</p>
            <p className="text-sm text-slate-500 mt-1">Set requirements and click &quot;Calculate Matches&quot; to find suitable testers.</p>
            <p className="text-xs text-slate-600 mt-1">{testers.length} approved testers available for matching</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, i) => (
              <MatchCard key={`${match.tester_id}-${i}`} match={match} />
            ))}
            {filteredMatches.length === 0 && (
              <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
                <p className="text-slate-400">No testers match the current filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function RequirementsPanel({ requirements, setRequirements }: { requirements: ProjectMatchingRequirements; setRequirements: (r: ProjectMatchingRequirements) => void }) {
  const deviceOptions = ['windows', 'macos', 'android', 'ios', 'ipad', 'android-tablet', 'chromebook', 'smart-tv'];
  const browserOptions = ['Google Chrome', 'Microsoft Edge', 'Mozilla Firefox', 'Safari', 'Opera'];
  const activityOptions = ['Following a prepared test script', 'Exploring freely', 'Testing complete user journeys', 'Checking forms and validation', 'Checkout and payment testing', 'Mobile responsiveness', 'Accessibility testing', 'Screen recording', 'Multi-device testing'];
  const industryOptions = ['property', 'weddings', 'security', 'automotive', 'ecommerce', 'finance', 'healthcare', 'home-services', 'business-software', 'hospitality', 'education', 'hr', 'logistics', 'smart-home'];

  return (
    <div className="mb-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1E293B] p-5">
      <h3 className="font-bold text-white text-sm mb-4">Matching Requirements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Required</h4>
          <ReqSelector label="Device Types" options={deviceOptions} selected={requirements.required.deviceTypes || []} onChange={(v) => setRequirements({ ...requirements, required: { ...requirements.required, deviceTypes: v } })} />
          <ReqSelector label="Browsers" options={browserOptions} selected={requirements.required.browsers || []} onChange={(v) => setRequirements({ ...requirements, required: { ...requirements.required, browsers: v } })} />
          <ReqSelector label="Testing Activities" options={activityOptions} selected={requirements.required.testingActivities || []} onChange={(v) => setRequirements({ ...requirements, required: { ...requirements.required, testingActivities: v } })} />
          <label className="flex items-center gap-2 mt-3 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={requirements.required.screenRecording || false} onChange={(e) => setRequirements({ ...requirements, required: { ...requirements.required, screenRecording: e.target.checked } })} className="rounded border-slate-600 text-[#06B6D4]" />
            Screen Recording Required
          </label>
          <label className="flex items-center gap-2 mt-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={requirements.required.accessibilityExperience || false} onChange={(e) => setRequirements({ ...requirements, required: { ...requirements.required, accessibilityExperience: e.target.checked } })} className="rounded border-slate-600 text-[#06B6D4]" />
            Accessibility Experience Required
          </label>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Preferred</h4>
          <ReqSelector label="Industries" options={industryOptions} selected={requirements.preferred.industries || []} onChange={(v) => setRequirements({ ...requirements, preferred: { ...requirements.preferred, industries: v } })} />
          <ReqSelector label="Devices" options={deviceOptions} selected={requirements.preferred.devices || []} onChange={(v) => setRequirements({ ...requirements, preferred: { ...requirements.preferred, devices: v } })} />
        </div>
      </div>
    </div>
  );
}

function ReqSelector({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-medium text-slate-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer whitespace-nowrap ${
              selected.includes(opt) ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'border-[rgba(255,255,255,0.06)] text-slate-500 hover:border-[rgba(255,255,255,0.15)]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const color = SUITABILITY_COLORS[match.suitability_label as SuitabilityLabel] || '#6B7280';
  const scores = match.dimension_scores || {};

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1E293B] p-4 hover:border-[rgba(255,255,255,0.15)] transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-white text-sm">{match.tester_name}</p>
            <span className="text-xs text-slate-500">{match.tester_email}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border" style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}>
              {match.suitability_label}
            </span>
            {match.tester_conflict && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-2.5 w-2.5" /> Conflict Flag
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-500">Bug Report</p>
          <p className="text-sm font-bold text-amber-400">{match.tester_bug_score}/5</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden mb-1">
              <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: (value as number) >= 70 ? '#10B981' : (value as number) >= 40 ? '#F59E0B' : '#EF4444' }} />
            </div>
            <span className="text-[9px] text-slate-500">{key.replace('Match', '')}</span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-slate-400">{match.explanation_json}</p>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {(match.tester_tags || []).slice(0, 6).map((t: string) => (
            <span key={t} className="inline-flex items-center rounded-full bg-[#06B6D4]/8 px-2 py-0.5 text-[9px] text-[#06B6D4]">{t}</span>
          ))}
          {(match.tester_tags || []).length > 6 && <span className="text-[9px] text-slate-500">+{(match.tester_tags || []).length - 6} more</span>}
        </div>
      </div>

      {match.missing_requirements && match.missing_requirements.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {match.missing_requirements.map((mr: string) => (
            <span key={mr} className="inline-flex items-center gap-1 rounded-full bg-red-500/8 px-2 py-0.5 text-[9px] text-red-400 border border-red-500/15">
              <X className="h-2.5 w-2.5" /> {mr}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Devices: {match.tester_devices?.join(', ') || '—'}</span>
        <span>•</span>
        <span>Experience: {match.tester_experience || '—'}</span>
      </div>
    </div>
  );
}