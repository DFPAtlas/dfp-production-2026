'use client';

import type { Document, Property } from '../lib/types';

interface Props {
  documents: Document[];
  properties: Property[];
}

const categoryColours: Record<string, string> = {
  Tenancy: 'bg-blue-50 text-blue-600',
  Compliance: 'bg-emerald-50 text-emerald-600',
  Finance: 'bg-amber-50 text-amber-600',
};

export default function DocumentsView({ documents, properties }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2332]">Property Documents</h2>
        <p className="text-sm text-[#8a8a8a]">{documents.length} files</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const prop = properties.find((p) => p.id === doc.propertyId);
          return (
            <div key={doc.id} className="rounded-xl border border-[#e8e5df] bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-file-text-line text-lg text-[#8a8a8a]" />
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${categoryColours[doc.category] || 'bg-slate-100 text-slate-500'}`}>
                  {doc.category}
                </span>
              </div>
              <p className="text-sm font-medium text-[#1a2332]">{doc.title}</p>
              <p className="mt-1 text-[10px] text-[#8a8a8a]">{prop?.address} · {doc.date}</p>
              <button className="mt-3 w-full rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[11px] font-medium text-[#1a2332] transition hover:bg-[#f0eeea] cursor-pointer whitespace-nowrap">
                Preview Demo Document
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}