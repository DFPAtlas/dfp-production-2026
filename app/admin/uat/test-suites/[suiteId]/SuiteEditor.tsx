'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, AlertCircle, Plus, Trash2, GripVertical,
  Eye, Archive, CheckCircle, X,
} from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

interface Suite {
  id: string; project_id: string; name: string; description: string | null;
  testing_type: string | null; status: string;
}

interface TestCase {
  id: string; suite_id: string; reference: string; title: string;
  description: string | null; preconditions: string | null;
  expected_result: string; priority: string; case_status: string;
  sort_order: number;
}

interface Step {
  id?: string; step_number: number; instruction: string; expected_result: string | null;
}

export default function SuiteEditor({ suiteId }: { suiteId: string }) {
  const router = useRouter();
  const [suite, setSuite] = useState<Suite | null>(null);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingCase, setEditingCase] = useState<Partial<TestCase> | null>(null);
  const [caseSteps, setCaseSteps] = useState<Step[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { loadData(); }, [suiteId]);

  const loadData = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('uat_test_suites').select('*').eq('id', suiteId).maybeSingle();
    if (!s) { setError('Suite not found.'); setLoading(false); return; }
    setSuite(s as Suite);

    const { data: tcs } = await supabase.from('uat_test_cases')
      .select('*').eq('suite_id', suiteId).order('sort_order', { ascending: true });
    setCases((tcs || []) as TestCase[]);
    setLoading(false);
  };

  const openNewCase = () => {
    setEditingCase({
      suite_id: suiteId,
      title: '',
      reference: `TC-${String(cases.length + 1).padStart(3, '0')}`,
      description: '',
      preconditions: '',
      expected_result: '',
      priority: 'medium',
      case_status: 'draft',
      sort_order: cases.length,
    });
    setCaseSteps([]);
    setSaveError('');
    setDrawerOpen(true);
  };

  const openEditCase = async (tc: TestCase) => {
    setEditingCase({ ...tc });
    const { data: steps } = await supabase.from('uat_test_case_steps')
      .select('*').eq('test_case_id', tc.id).order('step_number', { ascending: true });
    setCaseSteps((steps || []) as Step[]);
    setSaveError('');
    setDrawerOpen(true);
  };

  const addStep = () => {
    setCaseSteps((prev) => [
      ...prev,
      { step_number: prev.length + 1, instruction: '', expected_result: null },
    ]);
  };

  const updateStep = (idx: number, field: keyof Step, value: string) => {
    setCaseSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeStep = (idx: number) => {
    setCaseSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const handleSaveCase = async () => {
    if (!editingCase) return;
    if (!editingCase.title?.trim()) { setSaveError('Title is required.'); return; }
    if (!editingCase.expected_result?.trim()) { setSaveError('Expected result is required.'); return; }
    if (caseSteps.length === 0 || caseSteps.every((s) => !s.instruction.trim())) {
      setSaveError('At least one step with an instruction is required.'); return;
    }

    setSaving(true); setSaveError('');

    const userId = (await supabase.auth.getUser()).data.user?.id || null;

    let tcId = editingCase.id;

    if (editingCase.id) {
      const { error: err } = await supabase.from('uat_test_cases').update({
        title: editingCase.title.trim(),
        reference: editingCase.reference?.trim() || null,
        description: editingCase.description?.trim() || null,
        preconditions: editingCase.preconditions?.trim() || null,
        expected_result: editingCase.expected_result.trim(),
        priority: editingCase.priority || 'medium',
        case_status: editingCase.case_status || 'draft',
        sort_order: editingCase.sort_order || 0,
        updated_at: new Date().toISOString(),
        project_id: suite?.project_id,
        suite_id: suiteId,
      }).eq('id', editingCase.id);
      if (err) { setSaveError(err.message); setSaving(false); return; }

      await supabase.from('uat_test_case_steps').delete().eq('test_case_id', editingCase.id);
    } else {
      const { data: newTc, error: err } = await supabase.from('uat_test_cases').insert({
        title: editingCase.title.trim(),
        reference: editingCase.reference?.trim() || null,
        description: editingCase.description?.trim() || null,
        preconditions: editingCase.preconditions?.trim() || null,
        expected_result: editingCase.expected_result.trim(),
        priority: editingCase.priority || 'medium',
        case_status: editingCase.case_status || 'draft',
        sort_order: editingCase.sort_order || 0,
        project_id: suite?.project_id,
        suite_id: suiteId,
        created_by: userId,
      }).select('id').single();
      if (err) { setSaveError(err.message); setSaving(false); return; }
      tcId = (newTc as any).id;
    }

    const validSteps = caseSteps.filter((s) => s.instruction.trim());
    if (validSteps.length > 0 && tcId) {
      await supabase.from('uat_test_case_steps').insert(
        validSteps.map((s, i) => ({
          test_case_id: tcId,
          step_number: i + 1,
          instruction: s.instruction.trim(),
          expected_result: s.expected_result?.trim() || null,
        }))
      );
    }

    setSaving(false);
    setDrawerOpen(false);
    loadData();
  };

  const handleToggleCaseStatus = async (tc: TestCase) => {
    const newStatus = tc.case_status === 'archived' ? 'active' : 'archived';
    await supabase.from('uat_test_cases').update({ case_status: newStatus, archived_at: newStatus === 'archived' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', tc.id);
    loadData();
  };

  const handleActivateSuite = async () => {
    if (!suite) return;
    const newStatus = suite.status === 'active' ? 'draft' : 'active';
    await supabase.from('uat_test_suites').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', suite.id);
    loadData();
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (!suite) {
    return (
      <AdminShell>
        <div className="text-center py-20">
          <p className="text-slate-400">{error || 'Suite not found.'}</p>
          <button onClick={() => router.push('/admin/uat/projects')} className="mt-4 px-4 py-2 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to Projects</button>
        </div>
      </AdminShell>
    );
  }

  const statusConfig: Record<string, { color: string }> = {
    draft: { color: '#94A3B8' },
    active: { color: '#10B981' },
    archived: { color: '#6B7280' },
  };

  const priorityColors: Record<string, string> = {
    critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#6B7280',
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push(`/admin/uat/projects/${suite.project_id}/test-suites`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Suites
        </button>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{suite.name}</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: (statusConfig[suite.status]?.color || '#94A3B8') + '15', color: statusConfig[suite.status]?.color }}>
                  {suite.status}
                </span>
              </div>
              {suite.description && <p className="text-sm text-slate-400">{suite.description}</p>}
              {suite.testing_type && <p className="text-xs text-slate-500 mt-1">Type: {suite.testing_type}</p>}
            </div>
            <button onClick={handleActivateSuite}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                suite.status === 'active' ? 'bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white' :
                'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              }`}>
              {suite.status === 'active' ? 'Set Draft' : 'Activate Suite'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Test Cases ({cases.length})
          </h2>
          <button onClick={openNewCase}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Test Case
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl">
            <p className="text-slate-400">No test cases yet</p>
            <p className="text-sm text-slate-500 mt-1">Add test cases to this suite</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cases.map((tc) => (
              <div key={tc.id} className={`bg-[#1E293B] border rounded-2xl p-4 flex items-center justify-between ${
                tc.case_status === 'archived' ? 'opacity-50 border-[rgba(255,255,255,0.04)]' : 'border-[rgba(255,255,255,0.08)]'
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-[#06B6D4]">{tc.reference}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: (priorityColors[tc.priority] || '#6B7280') + '15', color: priorityColors[tc.priority] || '#6B7280' }}>
                      {tc.priority}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      tc.case_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      tc.case_status === 'archived' ? 'bg-slate-500/10 text-slate-500' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>{tc.case_status}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{tc.title}</p>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button onClick={() => openEditCase(tc)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] cursor-pointer">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleToggleCaseStatus(tc)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-400 cursor-pointer">
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {drawerOpen && editingCase && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setDrawerOpen(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#1E293B] border-l border-[rgba(255,255,255,0.08)] z-50 shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-[#1E293B] border-b border-[rgba(255,255,255,0.08)] p-6 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-white">
                  {editingCase.id ? 'Edit Test Case' : 'New Test Case'}
                </h3>
                <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Reference</label>
                    <input type="text" value={editingCase.reference || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, reference: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                    <select value={editingCase.priority || 'medium'}
                      onChange={(e) => setEditingCase({ ...editingCase, priority: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer pr-8">
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                  <input type="text" value={editingCase.title || ''}
                    onChange={(e) => setEditingCase({ ...editingCase, title: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea value={editingCase.description || ''}
                    onChange={(e) => setEditingCase({ ...editingCase, description: e.target.value })}
                    rows={2} maxLength={500}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preconditions</label>
                  <textarea value={editingCase.preconditions || ''}
                    onChange={(e) => setEditingCase({ ...editingCase, preconditions: e.target.value })}
                    rows={2} maxLength={500}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expected Result *</label>
                  <textarea value={editingCase.expected_result || ''}
                    onChange={(e) => setEditingCase({ ...editingCase, expected_result: e.target.value })}
                    rows={2} maxLength={500}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-300">Test Steps</label>
                    <button onClick={addStep}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-lg text-[11px] font-semibold text-[#06B6D4] hover:bg-[#06B6D4]/20 cursor-pointer transition-colors whitespace-nowrap">
                      <Plus className="w-3 h-3" /> Add Step
                    </button>
                  </div>
                  {caseSteps.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No steps yet. Add at least one step.</p>
                  ) : (
                    <div className="space-y-2">
                      {caseSteps.map((step, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                            <input type="text" value={step.instruction}
                              onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                              placeholder="Step instruction..."
                              className="flex-1 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                            <button onClick={() => removeStep(idx)}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <input type="text" value={step.expected_result || ''}
                            onChange={(e) => updateStep(idx, 'expected_result', e.target.value)}
                            placeholder="Expected result for this step (optional)..."
                            className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {saveError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{saveError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setDrawerOpen(false)}
                    className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                  <button onClick={handleSaveCase} disabled={saving}
                    className="flex-1 px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Test Case
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}