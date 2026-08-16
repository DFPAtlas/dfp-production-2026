'use client';

import { useState } from 'react';
import { FileText, Download, Upload } from 'lucide-react';
import { PortalFile } from '../lib/types';

interface FilesViewProps {
  files: PortalFile[];
  onFilesChange: (files: PortalFile[]) => void;
  onActivity: (msg: string) => void;
}

const categoryColors: Record<string, string> = {
  Design: '#f59e0b',
  Documents: '#3b82f6',
  Invoices: '#8b5cf6',
};

export default function FilesView({
  files,
  onFilesChange,
  onActivity,
}: FilesViewProps) {
  const [selectedId, setSelectedId] = useState('design');
  const [filter, setFilter] = useState<'All' | 'Design' | 'Documents' | 'Invoices'>('All');
  const selected = files.find((f) => f.id === selectedId) ?? files[0];

  const filtered = filter === 'All' ? files : files.filter((f) => f.category === filter);

  const simulateUpload = () => {
    if (files.some((f) => f.id === 'logo-pack')) {
      onActivity('The simulated logo pack has already been uploaded.');
      return;
    }
    const uploaded: PortalFile = {
      id: 'logo-pack',
      name: 'Client logo pack.zip',
      type: 'ZIP',
      size: '3.4 MB',
      uploadedBy: 'Aster & Co.',
      date: 'Just now',
      category: 'Design',
      status: 'Needs Review',
    };
    onFilesChange([...files, uploaded]);
    setSelectedId(uploaded.id);
    onActivity('Simulated client logo pack uploaded.');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1a2332]">Project Files</h2>
            <p className="mt-1 text-xs text-[#6b7b8e]">
              {files.length} files available
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['All', 'Design', 'Documents', 'Invoices'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                  filter === cat
                    ? 'bg-[#1a2332] text-white'
                    : 'bg-[#f6f5f2] text-[#6b7b8e] hover:bg-[#e8e5df]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => {
                setSelectedId(file.id);
                onActivity(`Opened file: ${file.name}.`);
              }}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                selectedId === file.id
                  ? 'border-[#3b82f6]/30 bg-[#eff6ff]'
                  : 'border-[#e8e5df] bg-[#fafaf8] hover:border-[#3b82f6]/20'
              }`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${categoryColors[file.category]}10`, color: categoryColors[file.category] }}
              >
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1a2332]">{file.name}</p>
                <p className="mt-0.5 text-xs text-[#8a8a8a]">{file.uploadedBy} &middot; {file.date}</p>
              </div>
              <div className="flex items-center gap-2">
                {file.status && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    file.status === 'Approved' ? 'bg-[#10b981]/10 text-[#059669]' :
                    file.status === 'Needs Review' ? 'bg-[#f59e0b]/10 text-[#d97706]' :
                    'bg-[#e8e5df] text-[#8a8a8a]'
                  }`}>
                    {file.status}
                  </span>
                )}
                <span className="text-[10px] text-[#8a8a8a]">{file.size}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={simulateUpload}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#e8e5df] bg-white px-4 py-2.5 text-xs font-medium text-[#6b7b8e] transition hover:bg-[#f6f5f2]"
        >
          <Upload className="h-3.5 w-3.5" />
          Simulate upload
        </button>
      </div>

      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
          File Detail
        </p>
        <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#3b82f6]/10 text-[#3b82f6]">
          <FileText className="h-10 w-10" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-[#1a2332]">{selected.name}</h3>
        <dl className="mt-5 space-y-4 text-xs">
          {[
            ['Type', selected.type],
            ['Size', selected.size],
            ['Category', selected.category],
            ['Uploaded by', selected.uploadedBy],
            ['Date', selected.date],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-[#e8e5df] pb-3 last:border-0">
              <dt className="text-[#8a8a8a]">{label}</dt>
              <dd className="font-medium text-[#1a2332]">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => onActivity(`Simulated download: ${selected.name}`)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e5df] bg-[#fafaf8] px-4 py-3 text-sm font-medium text-[#6b7b8e] transition hover:bg-[#f6f5f2]"
        >
          <Download className="h-4 w-4" />
          Preview (Demo)
        </button>
        <p className="mt-2 text-[10px] text-[#8a8a8a]">
          <i className="ri-information-line mr-1"></i>
          Demo only — no real file download
        </p>
      </div>
    </div>
  );
}