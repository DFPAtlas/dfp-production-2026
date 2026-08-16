'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Play, Pause, Trophy, Archive, XCircle, BarChart3, ShieldCheck,
  AlertTriangle, CheckCircle2, Clock, Users, ChevronRight,
  Loader2, Send, FileText,
} from 'lucide-react';

const STATUS_CONFIG: Record<string,{label:string;color:string}> = {
  draft:{label:'Draft',color:'bg-slate-500/10 text-slate-400 border-slate-500/20'},
  ready_for_review:{label:'Ready for Review',color:'bg-blue-500/10 text-blue-400 border-blue-500/20'},
  approved:{label:'Approved',color:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  scheduled:{label:'Scheduled',color:'bg-violet-500/10 text-violet-400 border-violet-500/20'},
  running:{label:'Running',color:'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'},
  paused:{label:'Paused',color:'bg-orange-500/10 text-orange-400 border-orange-500/20'},
  awaiting_decision:{label:'Awaiting Decision',color:'bg-amber-500/10 text-amber-400 border-amber-500/20'},
  winner_selected:{label:'Winner Selected',color:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  rolling_out:{label:'Rolling Out',color:'bg-teal-500/10 text-teal-400 border-teal-500/20'},
  completed:{label:'Completed',color:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  cancelled:{label:'Cancelled',color:'bg-red-500/10 text-red-400 border-red-500/20'},
  failed:{label:'Failed',color:'bg-red-500/10 text-red-400 border-red-500/20'},
  inconclusive:{label:'Inconclusive',color:'bg-slate-500/10 text-slate-400 border-slate-500/20'},
  archived:{label:'Archived',color:'bg-slate-500/10 text-slate-500 border-slate-500/20'},
};

const METRIC_LABELS: Record<string,string> = {
  unique_click_rate:'Unique Click Rate',click_to_open_rate:'Click-to-Open Rate',conversion_rate:'Conversion Rate',
  unsubscribe_rate:'Unsubscribe Rate',complaint_rate:'Complaint Rate',hard_bounce_rate:'Hard Bounce Rate',
  delivery_rate:'Delivery Rate',goal_completion:'Goal Completion',open_rate:'Open Rate',
};

const TYPE_LABELS: Record<string,string> = {
  subject_line:'Subject Line',preview_text:'Preview Text',sender_name:'Sender Name',send_time:'Send Time',
  heading:'Heading',introduction:'Introduction',cta_wording:'CTA Wording',button_style:'Button Style',
  content_section:'Content Section',full_content:'Full Content',language_variant:'Language Variant',layout_variant:'Layout Variant',
};

interface ExperimentDetail {
  id:string;name:string;description:string;brand_kit_id:string|null;source_type:string;source_campaign_id:string|null;
  source_automation_id:string|null;experiment_type:string;hypothesis:Record<string,unknown>;variants:{id:string;label:string;type:string;description:string;subject_override?:string;preview_text_override?:string}[];
  audience_config:{estimated_total?:number;estimated_eligible?:number;suppressed?:number;unsubscribed?:number;invalid?:number};
  allocation_config:{type:string;holdout_percent?:number;variant_percentages?:Record<string,number>};
  metrics_config:{primary?:{name?:string;description?:string};secondary?:{name:string}[];secondary_enabled?:string[]};
  guardrails_config:Record<string,{enabled:boolean;threshold:number}>;
  duration_config:{type:string;end_date?:string;min_hours?:number;min_recipients?:number};
  statistical_method:{method:string;confidence_threshold:number;min_sample_per_variant:number};
  status:string;decision:Record<string,unknown>;results:Record<string,unknown>;rollout_config:Record<string,unknown>;
  schedule_config:{start_at?:string;end_at?:string};tags:string[];owner_id:string|null;decision_owner_id:string|null;
  created_by:string|null;created_at:string;updated_at:string;
}

export default function ExperimentDetailClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [exp, setExp] = useState<ExperimentDetail|null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{action:string;label:string}|null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  useEffect(()=>{loadExperiment();},[params.id]);

  const loadExperiment = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_experiments').select('*').eq('id',params.id).maybeSingle();
    if(data)setExp(data as ExperimentDetail);else setTimeout(() => router.push('/admin/email/experiments'), 0);
    setLoading(false);
  };

  const updateStatus = async (status:string, extra?:Record<string,unknown>) => {
    if(!exp)return;
    setUpdating(true);
    setError('');
    const payload:Record<string,unknown> = { status, updated_at: new Date().toISOString() };
    if(extra) Object.assign(payload, extra);
    const { error:updateError } = await supabase.from('email_experiments').update(payload).eq('id',exp.id);
    if(updateError){setError('Update failed: '+updateError.message);setUpdating(false);return;}
    setExp({...exp,status,...extra as Partial<ExperimentDetail>});
    setUpdating(false);
    setConfirmAction(null);
    setDecisionNote('');
    setCancelReason('');
  };

  const handleRunner = async () => {
    if(!exp)return;
    if(exp.status==='draft'||exp.status==='ready_for_review')await updateStatus('running',{schedule_config:{...exp.schedule_config,start_at:new Date().toISOString()}});
    else if(exp.status==='running')await updateStatus('paused');
    else if(exp.status==='paused')await updateStatus('running');
    else if(exp.status==='scheduled')await updateStatus('running',{schedule_config:{...exp.schedule_config,start_at:new Date().toISOString()}});
  };

  if(loading){return(<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" /></div>);}
  if(!exp)return null;

  const sc = STATUS_CONFIG[exp.status]||STATUS_CONFIG.draft;
  const primaryMetric = exp.metrics_config?.primary?.name||'';
  const allocation = exp.allocation_config;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/email/experiments" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{exp.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${sc.color}`}>{sc.label}</span>
              <span className="text-[11px] text-slate-600">{TYPE_LABELS[exp.experiment_type]||exp.experiment_type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/email/experiments/${exp.id}/report`} className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <BarChart3 className="w-3.5 h-3.5" /> Report
          </Link>
          {['draft','ready_for_review','approved','scheduled'].includes(exp.status)&&(
            <button onClick={handleRunner} disabled={updating} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap">
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
          {exp.status==='running'&&(
            <button onClick={handleRunner} disabled={updating} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/20 border border-orange-500/30 text-orange-400 rounded-lg text-xs font-semibold hover:bg-orange-600/30 transition-all cursor-pointer whitespace-nowrap">
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          )}
          {exp.status==='paused'&&(
            <button onClick={handleRunner} disabled={updating} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap">
              <Play className="w-3.5 h-3.5" /> Resume
            </button>
          )}
          {exp.status==='awaiting_decision'&&(
            <button onClick={()=>setConfirmAction({action:'complete',label:'Select Winner'})} className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-all cursor-pointer whitespace-nowrap">
              <Trophy className="w-3.5 h-3.5" /> Winner
            </button>
          )}
          {exp.status==='running'&&(
            <button onClick={()=>setConfirmAction({action:'cancel',label:'Cancel Experiment'})} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap">
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {error&&<div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Hypothesis</h3>
          <div className="space-y-3 text-xs">
            {[{label:'Changes',value:(exp.hypothesis as Record<string,string>)?.changes},{label:'Reason',value:(exp.hypothesis as Record<string,string>)?.reason},{label:'Audience',value:(exp.hypothesis as Record<string,string>)?.intended_audience},{label:'Expected',value:(exp.hypothesis as Record<string,string>)?.expected_direction},{label:'Decision Rule',value:(exp.hypothesis as Record<string,string>)?.decision_rule}].map(i=>(
              <div key={i.label}><span className="text-slate-500 font-medium">{i.label}:</span> <span className="text-slate-300 ml-1">{i.value||'—'}</span></div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Variants</h3>
          <div className="space-y-3">
            {exp.variants.map((v,i)=>(
              <div key={v.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${v.type==='control'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-violet-500/10 text-violet-400 border-violet-500/20'}`}>{v.type==='control'?'Control':'Variant'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{v.label}</p>
                  {v.description&&<p className="text-[10px] text-slate-500">{v.description}</p>}
                  {v.subject_override&&<p className="text-[10px] text-slate-500">Subject: {v.subject_override}</p>}
                </div>
                <span className="text-[10px] text-slate-600">Var {String.fromCharCode(65+i)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Audience & Allocation</h3>
          <div className="grid grid-cols-2 gap-3">
            {[{label:'Estimated Total',value:exp.audience_config?.estimated_total||0},{label:'Eligible',value:exp.audience_config?.estimated_eligible||0,color:'text-emerald-400'},{label:'Suppressed',value:exp.audience_config?.suppressed||0},{label:'Unsubscribed',value:exp.audience_config?.unsubscribed||0}].map(s=>(
              <div key={s.label} className="bg-white/[0.02] rounded-xl p-3"><p className={`text-xl font-bold ${s.color||'text-white'}`}>{s.value}</p><p className="text-[10px] text-slate-500">{s.label}</p></div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Allocation: <span className="text-white capitalize">{allocation?.type}</span> ·{' '}
            {allocation?.type==='equal'&&`${Math.floor(100/exp.variants.length)}% per variant`}
            {allocation?.type==='holdout'&&`${allocation.holdout_percent||10}% holdout`}
          </p>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Metrics & Method</h3>
          <div className="space-y-2 text-xs">
            <p><span className="text-slate-500">Primary:</span> <span className="text-white ml-1">{METRIC_LABELS[primaryMetric]||primaryMetric}</span></p>
            <p><span className="text-slate-500">Method:</span> <span className="text-white ml-1 capitalize">{exp.statistical_method?.method}</span></p>
            <p><span className="text-slate-500">Confidence:</span> <span className="text-white ml-1">{exp.statistical_method?.confidence_threshold}%</span></p>
            <p><span className="text-slate-500">Min Sample/Variant:</span> <span className="text-white ml-1">{exp.statistical_method?.min_sample_per_variant}</span></p>
            <p><span className="text-slate-500">Duration:</span> <span className="text-white ml-1 capitalize">{exp.duration_config?.type}</span></p>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Guardrails</h3>
          {exp.guardrails_config && Object.entries(exp.guardrails_config).map(([k,v]: [string, unknown]) => {
            const gv = v as { enabled: boolean; threshold: number };
            return (
            <div key={k} className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
              <span className={`text-xs font-medium ${gv.enabled?'text-emerald-400':'text-slate-600'}`}>{gv.enabled?`≤ ${gv.threshold}%`:'Disabled'}</span>
            </div>
          )})}
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Meta</h3>
          <div className="text-xs space-y-1">
            <p><span className="text-slate-500">Source:</span> <span className="text-white ml-1 capitalize">{exp.source_type}</span></p>
            <p><span className="text-slate-500">Brand:</span> <span className="text-white ml-1">{exp.brand_kit_id||'DFP Default'}</span></p>
            <p><span className="text-slate-500">Tags:</span> <span className="text-white ml-1">{exp.tags?.join(', ')||'—'}</span></p>
            <p><span className="text-slate-500">Created:</span> <span className="text-white ml-1">{new Date(exp.created_at).toLocaleDateString()}</span></p>
            {exp.schedule_config?.start_at&&<p><span className="text-slate-500">Started:</span> <span className="text-white ml-1">{new Date(exp.schedule_config.start_at as string).toLocaleString()}</span></p>}
          </div>
        </div>
      </div>

      {confirmAction&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-white mb-3">{confirmAction.label}</h3>
            {confirmAction.action==='cancel'&&(
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Cancelling will stop unsent batches and preserve already-sent messages. This cannot be undone.</p>
                <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Reason for cancellation..." rows={2} maxLength={500} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y" />
                <div className="flex gap-3">
                  <button onClick={()=>{setConfirmAction(null);setCancelReason('');}} className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap">Back</button>
                  <button onClick={()=>updateStatus('cancelled',{decision:{...exp.decision,cancel_reason:cancelReason,cancelled_at:new Date().toISOString()}})} disabled={updating} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">Confirm Cancel</button>
                </div>
              </div>
            )}
            {confirmAction.action==='complete'&&(
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Select the winning variant or mark as inconclusive.</p>
                <div className="space-y-2">
                  {exp.variants.map(v=>(
                    <button key={v.id} onClick={()=>{setDecisionNote(v.label);}} className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${decisionNote===v.label?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-300 hover:border-[rgba(255,255,255,0.12)]'}`}>
                      <Trophy className="w-3.5 h-3.5 inline mr-2" />{v.label} {v.type==='control'?'(Control)':''}
                    </button>
                  ))}
                  <button onClick={()=>setDecisionNote('inconclusive')} className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${decisionNote==='inconclusive'?'bg-slate-500/10 border-slate-500/30 text-slate-400':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-300 hover:border-[rgba(255,255,255,0.12)]'}`}>
                    Inconclusive — No winner
                  </button>
                </div>
                <textarea value={decisionNote} onChange={e=>setDecisionNote(e.target.value)} placeholder="Decision note..." rows={2} maxLength={500} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y" />
                <div className="flex gap-3">
                  <button onClick={()=>{setConfirmAction(null);setDecisionNote('');}} className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap">Back</button>
                  <button onClick={()=>{const status=decisionNote&&decisionNote!=='inconclusive'?'winner_selected':'inconclusive';updateStatus(status,{decision:{...exp.decision,winner_variant:decisionNote,decided_at:new Date().toISOString(),decision_note:decisionNote}});}} disabled={updating||!decisionNote} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">Confirm Decision</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}