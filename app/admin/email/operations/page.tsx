'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, Users, FileText, BookOpen, GraduationCap, CalendarClock,
  GitBranch, Target, RotateCcw, Save, CheckCircle2, AlertTriangle,
  Clock, ExternalLink, ChevronRight, Plus, Trash2, Eye,
  RefreshCw, Activity, BarChart3, Ban, Play, Pause,
} from 'lucide-react';

interface OwnerRecord {
  role: string;
  name: string;
  email: string;
  team: string;
}

interface DocRecord {
  id: string;
  title: string;
  category: string;
  status: 'Draft' | 'Verified' | 'Needs review' | 'Archived';
  lastVerified: string;
  reviewDue: string;
  owner: string;
  url: string;
}

interface TrainingChecklist {
  id: string;
  role: string;
  items: { task: string; completed: boolean; completedBy: string; completedAt: string }[];
}

interface MaintenanceItem {
  id: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  task: string;
  owner: string;
  lastDone: string;
  nextDue: string;
  status: 'pending' | 'completed' | 'overdue';
}

interface ChangeRecord {
  id: string;
  title: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'requested' | 'approved' | 'in_progress' | 'verified' | 'rolled_back' | 'closed';
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  rollbackPlan: string;
  testEvidence: string;
}

interface ServiceObjective {
  key: string;
  label: string;
  description: string;
  target: number;
  unit: string;
  current: number | null;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  lastMeasured: string | null;
}

const DEFAULT_OWNERS: OwnerRecord[] = [
  { role: 'Product Owner', name: '', email: '', team: 'Leadership' },
  { role: 'Technical Owner', name: '', email: '', team: 'Engineering' },
  { role: 'Email Operations Owner', name: '', email: '', team: 'Marketing Operations' },
  { role: 'Compliance & Data Owner', name: '', email: '', team: 'Legal & Compliance' },
  { role: 'Support Owner', name: '', email: '', team: 'Support' },
  { role: 'Incident Commander', name: '', email: '', team: 'Engineering' },
  { role: 'Provider & DNS Admin', name: '', email: '', team: 'Infrastructure' },
];

const DEFAULT_DOCS: DocRecord[] = [
  { id: 'doc-1', title: 'Email Studio Overview & Architecture', category: 'Architecture', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-2', title: 'Environment & Configuration Guide', category: 'Operations', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-3', title: 'Provider, Domain, DNS & Sender Setup', category: 'Infrastructure', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-4', title: 'Template Editor & Brand Kit Guide', category: 'User Guide', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-5', title: 'Validation, Approval & Activation Process', category: 'Process', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-6', title: 'Campaign Operating Procedure', category: 'Runbook', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-7', title: 'Automation & Transactional Operating Procedure', category: 'Runbook', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-8', title: 'Contact, Consent, Preference & Suppression Procedure', category: 'Compliance', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-9', title: 'Analytics Definitions & Limitations', category: 'Reference', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-10', title: 'Incident Response & Kill-Switch Runbook', category: 'Runbook', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-11', title: 'Queue, Webhook & n8n Troubleshooting', category: 'Runbook', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-12', title: 'Release, Migration & Rollback Runbook', category: 'Runbook', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-13', title: 'Retention, Export & Privacy-Request Procedure', category: 'Compliance', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-14', title: 'Role & Permission Reference', category: 'Reference', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
  { id: 'doc-15', title: 'Known Limitations & Support Escalation', category: 'Support', status: 'Draft', lastVerified: '', reviewDue: '', owner: '', url: '' },
];

const RESPONSIBILITY_MATRIX: { area: string; roles: string[] }[] = [
  { area: 'Templates & Brand Kits', roles: ['Editor', 'Reviewer', 'Approver'] },
  { area: 'Campaign Approvals', roles: ['Reviewer', 'Approver', 'Campaign Operator'] },
  { area: 'Automations & Transactional Mappings', roles: ['Editor', 'Automation Operator', 'Technical Owner'] },
  { area: 'Contacts, Consent & Suppressions', roles: ['Compliance Owner', 'Contact Operator', 'Support Owner'] },
  { area: 'Provider, Domains & Senders', roles: ['Provider Admin', 'Technical Owner'] },
  { area: 'Webhooks, Queues & n8n', roles: ['Technical Owner', 'Infrastructure'] },
  { area: 'Analytics & Reporting', roles: ['Campaign Operator', 'Product Owner'] },
  { area: 'Incidents', roles: ['Incident Commander', 'Technical Owner', 'Support Owner'] },
  { area: 'Changes & Releases', roles: ['Technical Owner', 'Product Owner'] },
  { area: 'Retention & Privacy Requests', roles: ['Compliance Owner', 'Technical Owner'] },
];

const TRAINING_ROLES = ['Editor', 'Reviewer', 'Approver', 'Campaign Operator', 'Automation Operator', 'Contact & Compliance Operator', 'Administrator', 'Support Responder'];

const TRAINING_TASKS: Record<string, string[]> = {
  'Editor': ['Create a template from scratch', 'Edit an existing template', 'Run validation checks', 'Request a review', 'Upload images to storage'],
  'Reviewer': ['Review a submitted template', 'Add review comments', 'Request changes', 'Approve a valid template', 'Compare versions'],
  'Approver': ['Review approval queue', 'Approve template activation', 'Reject with reason', 'View version history', 'Restore a previous version'],
  'Campaign Operator': ['Create a campaign draft', 'Select template & audience', 'Review exclusion/suppression list', 'Send a test email', 'Schedule a campaign', 'Cancel a scheduled campaign'],
  'Automation Operator': ['Create an automation flow', 'Configure trigger & conditions', 'Add send/wait/branch steps', 'Test automation simulation', 'Activate & pause automation'],
  'Contact & Compliance Operator': ['Search contacts', 'View consent ledger', 'Process unsubscribe request', 'Review suppression list', 'Run import with field mapping', 'Export contacts with filters'],
  'Administrator': ['Configure provider connection', 'Add sending domain', 'Create sender profile', 'Manage RLS & permissions', 'Review audit log', 'Configure retention', 'Activate kill switch'],
  'Support Responder': ['View failed jobs', 'Check provider status', 'Look up a campaign by ID', 'Review recent incidents', 'Escalate to technical owner'],
};

const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  { id: 'm-d1', frequency: 'Daily', task: 'Check provider & webhook health', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-d2', frequency: 'Daily', task: 'Review queue backlog', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-d3', frequency: 'Daily', task: 'Check transactional health', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-w1', frequency: 'Weekly', task: 'Review campaign & automation failures', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-w2', frequency: 'Weekly', task: 'Monitor bounce & complaint trends', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-w3', frequency: 'Weekly', task: 'Check suppression & sender health', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-w4', frequency: 'Weekly', task: 'Verify backup & rollback readiness', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-m1', frequency: 'Monthly', task: 'Review permissions & access', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-m2', frequency: 'Monthly', task: 'Verify domain & sender configuration', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-m3', frequency: 'Monthly', task: 'Review cost & capacity', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-m4', frequency: 'Monthly', task: 'Update documentation & limitations', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-m5', frequency: 'Monthly', task: 'Review P2/P3 backlog', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-q1', frequency: 'Quarterly', task: 'RLS & security review', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-q2', frequency: 'Quarterly', task: 'Retention execution review', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-q3', frequency: 'Quarterly', task: 'Incident response exercise', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-q4', frequency: 'Quarterly', task: 'Disaster recovery test (where configured)', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-q5', frequency: 'Quarterly', task: 'Provider & DNS audit', owner: '', lastDone: '', nextDue: '', status: 'pending' },
  { id: 'm-q6', frequency: 'Quarterly', task: 'Accessibility & performance review', owner: '', lastDone: '', nextDue: '', status: 'pending' },
];

const DEFAULT_OBJECTIVES: ServiceObjective[] = [
  { key: 'critical_tx_success', label: 'Critical Transactional Success Rate', description: 'Percentage of critical transactional emails delivered successfully', target: 99.5, unit: '%', current: null, status: 'unknown', lastMeasured: null },
  { key: 'queue_delay_warning', label: 'Queue Delay Warning', description: 'Minutes before queue processing is considered delayed', target: 5, unit: 'min', current: null, status: 'unknown', lastMeasured: null },
  { key: 'webhook_processing', label: 'Webhook Processing Latency', description: 'Maximum acceptable webhook processing delay', target: 30, unit: 'sec', current: null, status: 'unknown', lastMeasured: null },
  { key: 'campaign_failure', label: 'Campaign Failure Threshold', description: 'Maximum acceptable campaign failure rate', target: 2, unit: '%', current: null, status: 'unknown', lastMeasured: null },
  { key: 'bounce_threshold', label: 'Bounce Rate Threshold', description: 'Maximum acceptable hard bounce rate', target: 3, unit: '%', current: null, status: 'unknown', lastMeasured: null },
  { key: 'complaint_threshold', label: 'Complaint Rate Threshold', description: 'Maximum acceptable complaint rate', target: 0.1, unit: '%', current: null, status: 'unknown', lastMeasured: null },
  { key: 'incident_ack', label: 'Incident Acknowledgment', description: 'Target time to acknowledge SEV-1/SEV-2 incidents', target: 30, unit: 'min', current: null, status: 'unknown', lastMeasured: null },
  { key: 'doc_review', label: 'Documentation Review Interval', description: 'Days between documentation reviews', target: 90, unit: 'days', current: null, status: 'unknown', lastMeasured: null },
];

const DOC_STATUS_STYLES: Record<string, string> = {
  'Draft': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Verified': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Needs review': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Archived': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const RISK_STYLES: Record<string, string> = {
  'Low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'High': 'bg-red-500/10 text-red-400 border-red-500/20',
};

const FREQ_COLORS: Record<string, string> = {
  'Daily': 'text-red-400',
  'Weekly': 'text-amber-400',
  'Monthly': 'text-blue-400',
  'Quarterly': 'text-emerald-400',
};

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<'ownership' | 'docs' | 'training' | 'maintenance' | 'changes' | 'objectives' | 'recovery'>('ownership');
  const [owners, setOwners] = useState<OwnerRecord[]>(DEFAULT_OWNERS);
  const [docs, setDocs] = useState<DocRecord[]>(DEFAULT_DOCS);
  const [training, setTraining] = useState<TrainingChecklist[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>(MAINTENANCE_ITEMS);
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [objectives, setObjectives] = useState<ServiceObjective[]>(DEFAULT_OBJECTIVES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastReviewed, setLastReviewed] = useState('');
  const [nextReview, setNextReview] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocRecord | null>(null);
  const [showNewChange, setShowNewChange] = useState(false);
  const [newChange, setNewChange] = useState({ title: '', riskLevel: 'Low' as ChangeRecord['riskLevel'], rollbackPlan: '', testEvidence: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: settings } = await supabase.from('email_studio_settings').select('service_objectives, updated_at').maybeSingle();
    if (settings?.service_objectives && typeof settings.service_objectives === 'object') {
      const saved = settings.service_objectives as Record<string, unknown>;
      const ownersData = (saved.owners as OwnerRecord[]) || DEFAULT_OWNERS;
      const docsData = (saved.docs as DocRecord[]) || DEFAULT_DOCS;
      const trainingData = (saved.training as TrainingChecklist[]) || [];
      const maintData = (saved.maintenance as MaintenanceItem[]) || MAINTENANCE_ITEMS;
      const changesData = (saved.changes as ChangeRecord[]) || [];
      const objData = (saved.objectives as ServiceObjective[]) || DEFAULT_OBJECTIVES;
      const lastRev = (saved.lastReviewed as string) || '';
      const nextRev = (saved.nextReview as string) || '';

      setOwners(ownersData);
      setDocs(docsData);
      setTraining(trainingData.length > 0 ? trainingData : buildDefaultTraining());
      setMaintenance(maintData);
      setChanges(changesData);
      setObjectives(objData);
      setLastReviewed(lastRev);
      setNextReview(nextRev);
    } else {
      setTraining(buildDefaultTraining());
    }
    setLoading(false);
  };

  const buildDefaultTraining = (): TrainingChecklist[] => {
    return TRAINING_ROLES.map((role, ri) => ({
      id: `train-${ri}`,
      role,
      items: (TRAINING_TASKS[role] || []).map(task => ({
        task, completed: false, completedBy: '', completedAt: '',
      })),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const payload = {
      owners,
      docs,
      training,
      maintenance,
      changes,
      objectives,
      lastReviewed: lastReviewed || new Date().toISOString().slice(0, 10),
      nextReview: nextReview || '',
    };
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();
    if (existing) {
      await supabase.from('email_studio_settings').update({
        service_objectives: payload as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('email_studio_settings').insert({
        service_objectives: payload as unknown as Record<string, unknown>,
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateOwner = (index: number, field: keyof OwnerRecord, value: string) => {
    setOwners(prev => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });
  };

  const updateDoc = (index: number, field: keyof DocRecord, value: string) => {
    setDocs(prev => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });
  };

  const toggleTrainingItem = (checklistIdx: number, itemIdx: number) => {
    setTraining(prev => {
      const n = [...prev];
      const items = [...n[checklistIdx].items];
      items[itemIdx] = { ...items[itemIdx], completed: !items[itemIdx].completed, completedAt: !items[itemIdx].completed ? new Date().toISOString() : '', completedBy: !items[itemIdx].completed ? 'Current user' : '' };
      n[checklistIdx] = { ...n[checklistIdx], items };
      return n;
    });
  };

  const markMaintenance = (id: string) => {
    setMaintenance(prev => prev.map(m => m.id === id ? { ...m, status: 'completed' as const, lastDone: new Date().toISOString().slice(0, 10) } : m));
  };

  const createChange = () => {
    if (!newChange.title.trim()) return;
    const record: ChangeRecord = {
      id: `chg-${Date.now()}`,
      title: newChange.title,
      riskLevel: newChange.riskLevel,
      status: 'requested',
      requestedBy: 'Current user',
      requestedAt: new Date().toISOString(),
      completedAt: null,
      rollbackPlan: newChange.rollbackPlan,
      testEvidence: newChange.testEvidence,
    };
    setChanges(prev => [record, ...prev]);
    setShowNewChange(false);
    setNewChange({ title: '', riskLevel: 'Low', rollbackPlan: '', testEvidence: '' });
  };

  const updateChangeStatus = (id: string, status: ChangeRecord['status']) => {
    setChanges(prev => prev.map(c => c.id === id ? { ...c, status, completedAt: status === 'closed' || status === 'verified' ? new Date().toISOString() : c.completedAt } : c));
  };

  const updateObjective = (key: string, field: 'target' | 'current', value: number) => {
    setObjectives(prev => prev.map(o => o.key === key ? { ...o, [field]: value, lastMeasured: field === 'current' ? new Date().toISOString() : o.lastMeasured } : o));
  };

  const measureObjective = (key: string) => {
    setObjectives(prev => prev.map(o => {
      if (o.key !== key) return o;
      const status: ServiceObjective['status'] = o.current !== null ? (o.current >= o.target * 0.9 ? 'ok' : o.current >= o.target * 0.7 ? 'warning' : 'critical') : 'unknown';
      return { ...o, status, lastMeasured: new Date().toISOString() };
    }));
  };

  const verifyDoc = (index: number) => {
    setDocs(prev => {
      const n = [...prev];
      n[index] = { ...n[index], status: 'Verified', lastVerified: new Date().toISOString().slice(0, 10), reviewDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) };
      return n;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  const docStats = { total: docs.length, verified: docs.filter(d => d.status === 'Verified').length, needsReview: docs.filter(d => d.status === 'Needs review').length, draft: docs.filter(d => d.status === 'Draft').length };
  const trainingProgress = training.length > 0 ? Math.round(training.reduce((a, t) => a + t.items.filter(i => i.completed).length, 0) / training.reduce((a, t) => a + t.items.length, 0) * 100) : 0;
  const maintOverdue = maintenance.filter(m => m.status === 'overdue' || (m.status === 'pending' && m.nextDue && new Date(m.nextDue) < new Date())).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <h1 className="text-xl font-bold text-white">Email Studio Operations</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Operational ownership, documentation, training, maintenance schedules and change management.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] overflow-x-auto">
        {([
          { key: 'ownership' as const, label: 'Ownership', icon: Users },
          { key: 'docs' as const, label: 'Documentation', icon: BookOpen, badge: docStats.needsReview + docStats.draft },
          { key: 'training' as const, label: 'Training', icon: GraduationCap, pct: trainingProgress },
          { key: 'maintenance' as const, label: 'Maintenance', icon: CalendarClock, badge: maintOverdue },
          { key: 'changes' as const, label: 'Change Log', icon: GitBranch },
          { key: 'objectives' as const, label: 'Service Objectives', icon: Target },
          { key: 'recovery' as const, label: 'Recovery', icon: RotateCcw },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.key ? 'text-[#06B6D4] border-[#06B6D4]' : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">{tab.badge}</span>
            )}
            {tab.pct !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">{tab.pct}%</span>
            )}
          </button>
        ))}
      </div>

      {/* Ownership & Responsibilities */}
      {activeTab === 'ownership' && (
        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Operational Owners</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Last reviewed: <input type="date" value={lastReviewed} onChange={e => setLastReviewed(e.target.value)} className="ml-1 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30" /></span>
                <span>Next review: <input type="date" value={nextReview} onChange={e => setNextReview(e.target.value)} className="ml-1 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30" /></span>
              </div>
            </div>
            <div className="space-y-3">
              {owners.map((owner, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl">
                  <div className="w-32 shrink-0">
                    <span className="text-xs font-semibold text-[#06B6D4]">{owner.role}</span>
                  </div>
                  <input type="text" value={owner.name} onChange={e => updateOwner(i, 'name', e.target.value)} placeholder="Name"
                    className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                  <input type="email" value={owner.email} onChange={e => updateOwner(i, 'email', e.target.value)} placeholder="Email"
                    className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                  <input type="text" value={owner.team} onChange={e => updateOwner(i, 'team', e.target.value)} placeholder="Team"
                    className="w-32 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Responsibility Matrix (RACI)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase">Area</th>
                    <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase">Responsible Roles</th>
                    <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase">Escalation Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {RESPONSIBILITY_MATRIX.map((row, i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="py-2.5 px-3 text-xs text-white font-medium">{row.area}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {row.roles.map((r, j) => (
                            <span key={j} className="px-1.5 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] text-[10px] font-medium">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-400">
                        {owners.find(o => row.roles.some(r => o.role.includes(r)))?.name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Documentation Library */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Docs</p>
              <p className="text-2xl font-bold text-white">{docStats.total}</p>
            </div>
            <div className="bg-[#121215] border border-emerald-500/10 rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Verified</p>
              <p className="text-2xl font-bold text-emerald-400">{docStats.verified}</p>
            </div>
            <div className="bg-[#121215] border border-red-500/10 rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Needs Review</p>
              <p className="text-2xl font-bold text-red-400">{docStats.needsReview}</p>
            </div>
            <div className="bg-[#121215] border border-amber-500/10 rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Draft</p>
              <p className="text-2xl font-bold text-amber-400">{docStats.draft}</p>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Documentation Library</h2>
              <p className="text-xs text-slate-500 mt-0.5">15 required documents. Each runbook should include purpose, scope, required role, preconditions, step-by-step procedure, expected result, failure states, escalation, rollback, audit evidence and last verified date.</p>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.03)]">
              {docs.map((doc, i) => (
                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${DOC_STATUS_STYLES[doc.status]}`}>{doc.status}</span>
                      <span className="text-xs text-slate-500">{doc.category}</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-1">{doc.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                      {doc.lastVerified && <span>Verified: {doc.lastVerified}</span>}
                      {doc.reviewDue && <span className={new Date(doc.reviewDue) < new Date() ? 'text-red-400' : ''}>Review due: {doc.reviewDue}</span>}
                      {doc.owner && <span>Owner: {doc.owner}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input type="text" value={doc.url} onChange={e => updateDoc(i, 'url', e.target.value)} placeholder="URL (e.g. /admin/cms/...)"
                      className="w-40 px-2 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                    />
                    <input type="text" value={doc.owner} onChange={e => updateDoc(i, 'owner', e.target.value)} placeholder="Owner"
                      className="w-24 px-2 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                    />
                    {doc.status !== 'Verified' && (
                      <button onClick={() => verifyDoc(i)}
                        className="px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                      >Verify</button>
                    )}
                    {doc.status === 'Verified' && (
                      <button onClick={() => updateDoc(i, 'status', 'Needs review')}
                        className="px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[11px] font-medium hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                      >Mark Needs Review</button>
                    )}
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-500 hover:text-white transition-colors cursor-pointer"
                      ><ExternalLink className="w-3.5 h-3.5" /></a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Training & Handover */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-[#06B6D4]/20 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-[#06B6D4]">{trainingProgress}%</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Overall Training Progress</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {training.reduce((a, t) => a + t.items.filter(i => i.completed).length, 0)} of {training.reduce((a, t) => a + t.items.length, 0)} tasks completed across {TRAINING_ROLES.length} roles
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {training.map((checklist, ci) => {
              const done = checklist.items.filter(i => i.completed).length;
              const total = checklist.items.length;
              const pct = Math.round(done / total * 100);
              return (
                <div key={checklist.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{checklist.role}</h3>
                    <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-400' : pct > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {done}/{total}
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    {checklist.items.map((item, ii) => (
                      <button key={ii} onClick={() => toggleTrainingItem(ci, ii)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          item.completed ? 'bg-emerald-500/[0.04] border border-emerald-500/10' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${item.completed ? 'bg-emerald-500/20 text-emerald-400' : 'border border-[rgba(255,255,255,0.1)] text-transparent'}`}>
                          {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}>{item.task}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Maintenance Schedule */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {maintOverdue > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-red-300">{maintOverdue} Overdue Items</h3>
                  <p className="text-xs text-red-400/70 mt-1">Some maintenance tasks are past their due date. Review and complete them to maintain operational readiness.</p>
                </div>
              </div>
            </div>
          )}

          {(['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const).map(freq => {
            const items = maintenance.filter(m => m.frequency === freq);
            return (
              <div key={freq} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <h2 className={`text-sm font-bold ${FREQ_COLORS[freq]}`}>{freq}</h2>
                  <span className="text-xs text-slate-500">{items.filter(i => i.status === 'completed').length}/{items.length} done</span>
                </div>
                <div className="divide-y divide-[rgba(255,255,255,0.03)]">
                  {items.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'completed' ? 'bg-emerald-400' : item.status === 'overdue' ? 'bg-red-400' : 'bg-slate-600'}`} />
                        <div className="min-w-0">
                          <p className={`text-sm ${item.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>{item.task}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-0.5">
                            {item.lastDone && <span>Done: {item.lastDone}</span>}
                            {item.owner && <span>Owner: {item.owner}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="text" value={item.owner} onChange={e => setMaintenance(prev => prev.map(m => m.id === item.id ? { ...m, owner: e.target.value } : m))}
                          placeholder="Owner" className="w-24 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                        />
                        {item.status !== 'completed' && (
                          <button onClick={() => markMaintenance(item.id)}
                            className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                          >Mark Done</button>
                        )}
                        {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Change & Release */}
      {activeTab === 'changes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Change Log</h2>
            <button onClick={() => setShowNewChange(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
            ><Plus className="w-3.5 h-3.5" /> New Change Request</button>
          </div>

          {changes.length === 0 ? (
            <div className="text-center py-16 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
              <GitBranch className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No change records yet</p>
              <p className="text-xs text-slate-600 mt-1">Changes will be tracked here as the Email Studio evolves</p>
            </div>
          ) : (
            <div className="space-y-2">
              {changes.map(ch => (
                <div key={ch.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${RISK_STYLES[ch.riskLevel]}`}>{ch.riskLevel}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${
                        ch.status === 'verified' || ch.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        ch.status === 'rolled_back' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        ch.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>{ch.status.replace(/_/g, ' ')}</span>
                      <h3 className="text-sm font-semibold text-white">{ch.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{new Date(ch.requestedAt).toLocaleDateString()}</span>
                      {ch.status === 'requested' && (
                        <button onClick={() => updateChangeStatus(ch.id, 'in_progress')}
                          className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-medium hover:bg-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >Start</button>
                      )}
                      {ch.status === 'in_progress' && (
                        <>
                          <button onClick={() => updateChangeStatus(ch.id, 'verified')}
                            className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                          >Verify</button>
                          <button onClick={() => updateChangeStatus(ch.id, 'rolled_back')}
                            className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                          >Rollback</button>
                        </>
                      )}
                      {ch.status === 'verified' && (
                        <button onClick={() => updateChangeStatus(ch.id, 'closed')}
                          className="px-2 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-lg text-[10px] font-medium hover:bg-slate-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >Close</button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
                    <div><span className="text-slate-500">Requested by:</span> <span className="text-white ml-1">{ch.requestedBy}</span></div>
                    {ch.completedAt && <div><span className="text-slate-500">Completed:</span> <span className="text-white ml-1">{new Date(ch.completedAt).toLocaleDateString()}</span></div>}
                    {ch.rollbackPlan && <div className="col-span-2"><span className="text-slate-500">Rollback plan:</span> <span className="text-slate-400 ml-1">{ch.rollbackPlan}</span></div>}
                    {ch.testEvidence && <div className="col-span-2"><span className="text-slate-500">Test evidence:</span> <span className="text-slate-400 ml-1">{ch.testEvidence}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showNewChange && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewChange(false)}>
              <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-white mb-4">New Change Request</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title *</label>
                    <input type="text" value={newChange.title} onChange={e => setNewChange(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Risk Level</label>
                    <select value={newChange.riskLevel} onChange={e => setNewChange(p => ({ ...p, riskLevel: e.target.value as ChangeRecord['riskLevel'] }))}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                    >
                      <option value="Low">Low — minor UI changes, documentation</option>
                      <option value="Medium">Medium — new features, schema changes</option>
                      <option value="High">High — provider secrets, RLS, send logic, domains</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rollback Plan</label>
                    <textarea value={newChange.rollbackPlan} onChange={e => setNewChange(p => ({ ...p, rollbackPlan: e.target.value }))} rows={2} maxLength={500}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Test Evidence</label>
                    <input type="text" value={newChange.testEvidence} onChange={e => setNewChange(p => ({ ...p, testEvidence: e.target.value }))} placeholder="Build passes, manual tests completed..."
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowNewChange(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap"
                  >Cancel</button>
                  <button onClick={createChange}
                    className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                  >Create Request</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Objectives */}
      {activeTab === 'objectives' && (
        <div className="space-y-6">
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-300">Internal Targets Only</h3>
                <p className="text-xs text-amber-400/70 mt-1">
                  These are internal operational targets, not guaranteed customer SLAs. They help monitor Email Studio health and identify areas needing attention.
                </p>
              </div>
            </div>
          </div>

          {objectives.map(obj => (
            <div key={obj.key} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{obj.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{obj.description}</p>
                  {obj.lastMeasured && (
                    <p className="text-[10px] text-slate-600 mt-1">Last measured: {new Date(obj.lastMeasured).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Target:</span>
                      <input type="number" value={obj.target} onChange={e => updateObjective(obj.key, 'target', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                      />
                      <span className="text-[10px] text-slate-500">{obj.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-500">Current:</span>
                      <input type="number" value={obj.current ?? ''} onChange={e => updateObjective(obj.key, 'current', e.target.value ? parseFloat(e.target.value) : 0)}
                        placeholder="—" className="w-20 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                      />
                      <span className="text-[10px] text-slate-500">{obj.unit}</span>
                    </div>
                  </div>
                  <button onClick={() => measureObjective(obj.key)}
                    className="px-2 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                  >Measure</button>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                    obj.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    obj.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    obj.status === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>{obj.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recovery Exercises */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-1">Recovery Exercises</h2>
            <p className="text-xs text-slate-500 mb-4">Non-destructive exercises to verify operational recovery capabilities. Run periodically to ensure readiness.</p>

            <div className="space-y-3">
              {[
                { title: 'Restore a Template Version', description: 'Verify version history is intact and previous versions can be restored.', risk: 'Low', action: 'Navigate to any template → Version History → Restore a previous version.' },
                { title: 'Roll Back a Feature Flag', description: 'Verify feature flags can be toggled and take immediate effect.', risk: 'Low', action: 'Navigate to General Settings → toggle Require Campaign Approval → Save → toggle back.' },
                { title: 'Reprocess a Webhook Event (Without Sending)', description: 'Verify webhook events are logged and can be inspected without re-sending.', risk: 'Low', action: 'Navigate to Settings → Webhooks → view recent events.' },
                { title: 'Reconcile an Idempotent Campaign Job', description: 'Verify send jobs have idempotency keys and cannot be duplicated.', risk: 'Low', action: 'Navigate to Sent page → inspect a sent campaign → verify single idempotency key.' },
                { title: 'Pause & Resume an Automation', description: 'Verify automations pause safely and can resume without data loss.', risk: 'Low', action: 'Navigate to Automations → select a test automation → Pause → Resume.' },
                { title: 'Run Retention Dry Run', description: 'Verify retention estimates without deleting data.', risk: 'Low', action: 'Navigate to Settings → Retention → Run Dry-Run Estimate.' },
                { title: 'Verify Kill Switch', description: 'Verify the kill switch blocks campaigns and automations as expected.', risk: 'Medium', action: 'Navigate to Pilot Control → toggle Kill Switch → verify blocked state → deactivate.' },
                { title: 'Export Audit Log', description: 'Verify audit logs can be exported for compliance review.', risk: 'Low', action: 'Navigate to Settings → Audit → Export CSV.' },
              ].map((ex, i) => (
                <div key={i} className="p-4 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{ex.title}</h3>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${RISK_STYLES[ex.risk]}`}>{ex.risk} Risk</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{ex.description}</p>
                      <p className="text-[10px] text-slate-600 mt-1.5">{ex.action}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap shrink-0">
                      Run Exercise
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-white">Disaster Recovery</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Database backups and point-in-time recovery are managed by Supabase. Application rollback is available through version redeployment. Full disaster recovery testing requires infrastructure configuration beyond the Email Studio application. Document your configured recovery capabilities before claiming full DR readiness.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}