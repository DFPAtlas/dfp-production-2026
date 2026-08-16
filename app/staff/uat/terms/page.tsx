'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StaffShell from '@/components/staff/StaffShell';
import { UAT_TERMS_VERSION, UAT_TERMS_TITLE, UAT_TERMS_SECTIONS, UAT_FINAL_DECLARATIONS, getTermsContentHash, TERMS_CONTENT_JSON } from '@/lib/uat-terms-content';
import { FileText, CheckCircle2, Clock3, Download, ShieldCheck, Loader2, AlertTriangle, PlusCircle } from 'lucide-react';

export default function StaffUatTermsPage() {
  const [activeTab, setActiveTab] = useState<'versions' | 'acceptances'>('versions');
  const [versions, setVersions] = useState<any[]>([]);
  const [acceptances, setAcceptances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: v }, { data: a }] = await Promise.all([
      supabase.from('uat_terms_versions').select('*').order('created_at', { ascending: false }),
      supabase.from('uat_terms_acceptances').select('*').order('accepted_at', { ascending: false }).limit(100),
    ]);
    setVersions(v || []);
    setAcceptances(a || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const seedVersion = async () => {
    setSeeding(true);
    setSeedMessage('');

    const { data: existing } = await supabase
      .from('uat_terms_versions')
      .select('id')
      .eq('version', UAT_TERMS_VERSION)
      .maybeSingle();

    if (existing) {
      setSeedMessage('Version ' + UAT_TERMS_VERSION + ' already exists.');
      setSeeding(false);
      return;
    }

    const { data: active } = await supabase
      .from('uat_terms_versions')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (active) {
      await supabase.from('uat_terms_versions').update({ is_active: false }).eq('id', active.id);
    }

    const contentHash = getTermsContentHash();
    const { error } = await supabase.from('uat_terms_versions').insert({
      version: UAT_TERMS_VERSION,
      title: UAT_TERMS_TITLE,
      effective_at: new Date().toISOString(),
      content_json: JSON.parse(TERMS_CONTENT_JSON),
      content_hash: contentHash,
      is_active: true,
    });

    if (error) {
      setSeedMessage('Failed: ' + error.message);
    } else {
      setSeedMessage('Version ' + UAT_TERMS_VERSION + ' created and activated.');
      await fetchData();
    }
    setSeeding(false);
  };

  const filteredAcceptances = acceptances.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.legal_name?.toLowerCase().includes(q)) ||
      (a.tester_email?.toLowerCase().includes(q)) ||
      (a.id?.toLowerCase().includes(q));
  });

  return (
    <StaffShell>
      <div className="min-h-screen bg-[#0f172a]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Legal Agreements</h1>
            <p className="mt-1 text-sm text-slate-400">Manage terms versions and tester acceptances</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('versions')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === 'versions' ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-slate-400 hover:text-white'}`}
            >
              Versions
            </button>
            <button
              onClick={() => setActiveTab('acceptances')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === 'acceptances' ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-slate-400 hover:text-white'}`}
            >
              Acceptances
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin" />
            </div>
          ) : activeTab === 'versions' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{versions.length} version{versions.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={seedVersion}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] transition disabled:opacity-60 whitespace-nowrap"
                >
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Seed Version {UAT_TERMS_VERSION}
                </button>
              </div>
              {seedMessage && (
                <div className={`rounded-xl p-4 text-sm ${seedMessage.startsWith('Failed') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {seedMessage}
                </div>
              )}
              {versions.length === 0 && !seedMessage && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-4">No terms versions found. Click &quot;Seed Version {UAT_TERMS_VERSION}&quot; to create the initial version.</p>
                </div>
              )}
              <div className="grid gap-4">
                {versions.map((v) => (
                  <div key={v.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{v.title}</h3>
                        <p className="text-sm text-slate-400 mt-0.5">Version {v.version}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${v.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Effective: {new Date(v.effective_at).toLocaleDateString('en-GB')}</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Hash: {v.content_hash}</span>
                      <span>Created: {new Date(v.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{filteredAcceptances.length} acceptance{filteredAcceptances.length !== 1 ? 's' : ''}</p>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or ID..."
                  className="w-72 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                />
              </div>
              {filteredAcceptances.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                  <p className="text-slate-400">No acceptances found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Tester</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Version</th>
                        <th className="px-5 py-3">Accepted</th>
                        <th className="px-5 py-3">Acceptance ID</th>
                        <th className="px-5 py-3">PDF Hash</th>
                        <th className="px-5 py-3">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAcceptances.map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-4 font-medium text-white">{a.legal_name}</td>
                          <td className="px-5 py-4 text-slate-400">{a.tester_email}</td>
                          <td className="px-5 py-4 text-slate-400">v{UAT_TERMS_VERSION}</td>
                          <td className="px-5 py-4 text-slate-400">{new Date(a.accepted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-slate-500">{a.id?.substring(0, 12)}...</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-slate-500">{a.pdf_sha256 ? a.pdf_sha256.substring(0, 16) + '...' : '-'}</span>
                          </td>
                          <td className="px-5 py-4">
                            {a.pdf_storage_path ? (
                              <DownloadPdfButton storagePath={a.pdf_storage_path} />
                            ) : (
                              <span className="text-xs text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StaffShell>
  );
}

function DownloadPdfButton({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (url) { window.open(url, '_blank'); return; }
    setLoading(true);
    const { data } = await supabase.storage.from('uat-legal-agreements').createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) { setUrl(data.signedUrl); window.open(data.signedUrl, '_blank'); }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED]/20 px-3 py-1.5 text-xs font-semibold text-[#A78BFA] hover:bg-[#7C3AED]/30 transition disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      PDF
    </button>
  );
}