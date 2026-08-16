'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  Search, RefreshCw, FileText, FolderOpen,
  Download, Eye, Upload, ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import StaffShell from '../../../components/staff/StaffShell';



interface ProjectFile {
  id: string;
  project_id: number;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  created_at: string;
  project_name?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function StaffFilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      const { data: sp } = await supabase.from('staff_profiles').select('id').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      await fetchData();
    }
    init();
  }, [router]);

  const fetchData = async () => {
    const [filesRes, projectsRes] = await Promise.all([
      supabase.from('project_files').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]);

    if (filesRes.data) {
      const enriched = filesRes.data.map(f => ({
        ...f,
        project_name: projectsRes.data?.find(p => String(p.id) === String(f.project_id))?.name || 'Unknown',
      }));
      setFiles(enriched);
      setFilteredFiles(enriched);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = files;
    if (searchQuery) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (categoryFilter !== 'all') filtered = filtered.filter(f => f.category === categoryFilter);
    setFilteredFiles(filtered);
  }, [searchQuery, categoryFilter, files]);

  const categories = ['Documents', 'Images', 'Design Assets', 'Contracts', 'Reports', 'Invoices'];
  const categoryColors: Record<string, string> = {
    Documents: '#2563EB', Images: '#8B5CF6', 'Design Assets': '#EC4899',
    Contracts: '#F59E0B', Reports: '#10B981', Invoices: '#06B6D4',
  };

  const totalSize = files.reduce((s, f) => s + (f.file_size || 0), 0);

  if (loading) {
    return (
      <StaffShell>
        <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" /></div>
      </StaffShell>
    );
  }

  return (
    <StaffShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Files</h1>
            <p className="text-sm text-slate-400 mt-0.5">{files.length} files · {formatBytes(totalSize)} total</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search files by name..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all" />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer appearance-none">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">File</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map(file => {
                  const catColor = categoryColors[file.category] || '#64748B';
                  return (
                    <tr key={file.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catColor}15` }}>
                            <FileText className="w-4 h-4" style={{ color: catColor }} />
                          </div>
                          <p className="text-sm font-medium text-white">{file.name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-400">{file.project_name}</td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border"
                          style={{ backgroundColor: `${catColor}10`, color: catColor, borderColor: `${catColor}20` }}>
                          {file.category}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-400">{formatBytes(file.file_size)}</td>
                      <td className="py-4 px-5 text-xs text-slate-400">
                        {new Date(file.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-1">
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer" title="Preview">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center py-16">
              <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium mb-1">No files found</p>
              <p className="text-sm text-slate-500">{searchQuery || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Upload files to project folders'}</p>
            </div>
          )}
        </div>
      </div>
    </StaffShell>
  );
}