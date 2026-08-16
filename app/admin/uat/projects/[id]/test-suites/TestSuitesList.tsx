'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileText, Archive, Eye, Loader2, AlertCircle } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

interface Suite {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  testing_type: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  case_count?: number;
}

export default function TestSuitesPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [projectId]);

  const loadData = async () => {
    setLoading(true); setError('');
    const { data, error: err } = await supabase.from('uat_test_suites')
      .select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
    if (err) { setError(err.message); setLoading(false); return; }

    const suitesData = data as Suite[];
    const suiteIds = suitesData.map((s) => s.id);
    if (suiteIds.length > 0) {
      const { data: counts } = await supabase.from('uat_test_cases')
        .select('suite_id')
        .in('suite_id', suiteIds);
      const countMap: Record<string, number> = {};
      counts?.forEach((c: any) => { countMap[c.suite_id] = (countMap[c.suite_id] || 0) + 1; });
      suitesData.forEach((s) => { s.case_count = countMap[s.id] || 0; });
    }

    setSuites(suitesData);
    setLoading(false);
  };

  const handleArchive = async (suite: Suite) => {
    const newStatus = suite.status === 'archived' ? 'active' : 'archived';
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

  const statusConfig: Record<string, { color: string }> = {
    draft: { color: '#94A3B8' },
    active: { color: '#10B981' },
    archived: { color: '#6B7280' },
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push(`/admin/uat/projects/${projectId}`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Test Suites</h1>
            <p className="text-sm text-slate-400 mt-1">{suites.length} suite{suites.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => router.push(`/admin/uat/projects/${projectId}/test-suites/new`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" /> New Suite
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {suites.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.01] border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No test suites yet</p>
            <p className="text-sm text-slate-500 mt-1">Create a test suite to organise test cases</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suites.map((suite) => (
              <div key={suite.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white text-sm">{suite.name}</h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: (statusConfig[suite.status]?.color || '#94A3B8') + '15', color: statusConfig[suite.status]?.color }}>
                      {suite.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {suite.testing_type && <span>Type: {suite.testing_type}</span>}
                    <span>{suite.case_count || 0} test case{(suite.case_count || 0) !== 1 ? 's' : ''}</span>
                    <span>Updated {new Date(suite.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={() => router.push(`/admin/uat/test-suites/${suite.id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleArchive(suite)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-400 cursor-pointer"
                    title={suite.status === 'archived' ? 'Reactivate' : 'Archive'}>
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}