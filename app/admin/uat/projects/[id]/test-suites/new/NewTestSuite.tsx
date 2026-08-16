'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

export default function NewTestSuite({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testingType, setTestingType] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Suite name is required.'); return; }
    setSaving(true); setError('');

    const { data, error: err } = await supabase.from('uat_test_suites').insert({
      project_id: projectId,
      name: name.trim(),
      description: description.trim() || null,
      testing_type: testingType.trim() || null,
      status: 'draft',
      sort_order: 0,
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    }).select('id').single();

    if (err) { setError(err.message); setSaving(false); return; }

    router.push(`/admin/uat/test-suites/${(data as any).id}`);
  };

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push(`/admin/uat/projects/${projectId}/test-suites`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Suites
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">New Test Suite</h1>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Suite Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. QuickGuard Core Flows"
              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500}
              placeholder="Describe the purpose of this test suite..."
              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Testing Type</label>
            <input type="text" value={testingType} onChange={(e) => setTestingType(e.target.value)}
              placeholder="e.g. Functional, Usability, Regression..."
              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push(`/admin/uat/projects/${projectId}/test-suites`)}
              className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create Suite
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}