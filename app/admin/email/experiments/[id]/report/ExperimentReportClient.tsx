'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BarChart3, Trophy, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface ExperimentData {
  id:string;name:string;experiment_type:string;status:string;
  hypothesis:Record<string,unknown>;variants:{id:string;label:string;type:string}[];
  audience_config:{estimated_eligible?:number;estimated_total?:number};
  allocation_config:{type:string;holdout_percent?:number};
  metrics_config:{
    primary?:{name:string;description:string};
    secondary?:{name:string;description?:string}[];
  };
  guardrails_config:Record<string,{enabled:boolean;threshold:number}>;
  results:Record<string,unknown>;decision:Record<string,unknown>;
  schedule_config:{start_at?:string;end_at?:string};
  created_at:string;
}

const METRIC_LABELS:Record<string,string> = {
  unique_click_rate:'Unique Click Rate',click_to_open_rate:'Click-to-Open Rate',conversion_rate:'Conversion Rate',
  unsubscribe_rate:'Unsubscribe Rate',complaint_rate:'Complaint Rate',hard_bounce_rate:'Hard Bounce Rate',
  delivery_rate:'Delivery Rate',goal_completion:'Goal Completion',
};

export default function ExperimentReportClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [exp, setExp] = useState<ExperimentData|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const { data } = await supabase.from('email_experiments').select('*').eq('id',params.id).maybeSingle();
      if(data)setExp(data as ExperimentData);else setTimeout(() => router.push('/admin/email/experiments'), 0);
      setLoading(false);
    })();
  },[params.id]);

  if(loading)return(<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" /></div>);
  if(!exp)return null;

  const primaryMetric = exp.metrics_config?.primary?.name||'';
  const verdict = exp.decision?.winner_variant
    ? `Winner: ${exp.decision.winner_variant}`
    : exp.status==='inconclusive'
      ? 'Inconclusive — No clear winner'
      : exp.status==='running'||exp.status==='awaiting_decision'
        ? 'Awaiting results'
        : 'Not yet decided';

  const guardrailItems: {key:string;enabled:boolean;threshold:number;actual:unknown}[] = [];
  if(exp.guardrails_config){
    const gr = (exp.results as Record<string,unknown>)?.guardrails as Record<string,unknown>|undefined;
    for(const [k,v] of Object.entries(exp.guardrails_config)){
      guardrailItems.push({key:k,enabled:v.enabled,threshold:v.threshold,actual:gr?.[k]});
    }
  }
  const hypothesis = exp.hypothesis as Record<string,string>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/email/experiments/${exp.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{exp.name}</h1>
          <p className="text-sm text-slate-400">Experiment Report</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-violet-400" /></div>
            <div><h3 className="text-sm font-semibold text-white">Primary Metric</h3><p className="text-[10px] text-slate-500">{METRIC_LABELS[primaryMetric]||primaryMetric}</p></div>
          </div>
          <p className="text-xs text-slate-400">Secondary: {exp.metrics_config?.secondary?.map(s=>s.name.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())).join(', ')||'None'}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-amber-400" /></div>
            <div><h3 className="text-sm font-semibold text-white">Verdict</h3><p className="text-[10px] text-slate-500">{exp.status}</p></div>
          </div>
          <p className="text-xs text-slate-400">{verdict}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-emerald-400" /></div>
            <div><h3 className="text-sm font-semibold text-white">Timeline</h3></div>
          </div>
          <p className="text-xs text-slate-400">
            Created: {new Date(exp.created_at).toLocaleDateString()}<br />
            {exp.schedule_config?.start_at&&`Started: ${new Date(exp.schedule_config.start_at as string).toLocaleDateString()}`}
            {exp.schedule_config?.end_at&&` · Ended: ${new Date(exp.schedule_config.end_at as string).toLocaleDateString()}`}
            {!exp.schedule_config?.start_at&&'Not yet started'}
          </p>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Hypothesis</h2>
        <div className="space-y-2 text-sm">
          {[
            {label:'Changes',value:hypothesis.changes},
            {label:'Reason',value:hypothesis.reason},
            {label:'Expected Direction',value:hypothesis.expected_direction},
            {label:'Decision Rule',value:hypothesis.decision_rule},
            {label:'Risks',value:hypothesis.risks},
          ].map(i=>(
            <div key={i.label}><span className="text-slate-500 font-medium">{i.label}:</span> <span className="text-slate-300 ml-2">{i.value||'—'}</span></div>
          ))}
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Variants & Allocation</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-left">
                <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Variant</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Delivered</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Primary Metric</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {exp.variants.map(v=>{
                const variantResults = (exp.results as Record<string,unknown>)?.variants as Record<string,Record<string,unknown>>|undefined;
                const vr = variantResults?.[v.id];
                return (
                  <tr key={v.id} className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-white">{v.label}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${v.type==='control'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-violet-500/10 text-violet-400 border-violet-500/20'}`}>{v.type==='control'?'Control':'Variant'}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-300">{vr?.assigned != null ? String(vr.assigned) : '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-300">{vr?.delivered != null ? String(vr.delivered) : '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-medium text-white">{vr?.primary_value!=null?`${vr.primary_value}%`:'—'}</span></td>
                    <td className="px-4 py-3">
                      {exp.decision?.winner_variant===v.label
                        ? <span className="inline-flex items-center gap-1 text-[10px] text-amber-400"><Trophy className="w-3 h-3" /> Winner</span>
                        : <span className="text-[10px] text-slate-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">Allocation: {exp.allocation_config?.type==='equal'?`Equal split (${Math.floor(100/exp.variants.length)}% each)`:`${exp.allocation_config?.type}`}. Assignment is deterministic and stable per experiment.</p>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Guardrails</h2>
        <div className="space-y-2">
          {guardrailItems.map(g => (
            <div key={g.key} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
              <span className="text-xs text-slate-400">{g.key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Threshold: ≤ {g.threshold}%</span>
                <span className={`text-xs font-medium ${g.actual!=null?Number(g.actual)<=g.threshold?'text-emerald-400':'text-red-400':'text-slate-600'}`}>
                  {g.actual!=null?`${g.actual}%`:g.enabled?'Monitoring':'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Decision & Notes</h2>
        <div className="space-y-2 text-sm">
          {exp.decision?.winner_variant
            ? <>
                <p><span className="text-slate-500">Winner:</span> <span className="text-amber-400 font-medium ml-2">{exp.decision.winner_variant as string}</span></p>
                <p><span className="text-slate-500">Decided:</span> <span className="text-slate-300 ml-2">{exp.decision.decided_at?new Date(exp.decision.decided_at as string).toLocaleString():'—'}</span></p>
                <p><span className="text-slate-500">Note:</span> <span className="text-slate-300 ml-2">{exp.decision.decision_note != null ? String(exp.decision.decision_note) : '—'}</span></p>
              </>
            : exp.status==='inconclusive'
              ? <p className="text-amber-400 text-sm">This experiment was marked inconclusive. No winner was selected.</p>
              : <p className="text-slate-500 text-sm">No decision has been made yet. This experiment is {exp.status}.</p>
          }
        </div>
      </div>

      <div className="p-4 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-300">Limitations</p>
          <p className="text-xs text-amber-400/70 mt-1">Results are based on available delivery data. Small sample sizes, incomplete events, and privacy features may affect accuracy. This report should not be treated as statistical proof. Results are internal guidance only.</p>
        </div>
      </div>
    </div>
  );
}
