'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Upload, ShieldCheck, FileArchive, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, ArrowLeft, FileText, Search,
  Download, Eye, GitCompare, Package, ChevronDown, ChevronUp,
} from 'lucide-react';

type Step = 'upload' | 'scan' | 'manifest' | 'compatibility' | 'conflicts' | 'dry_run' | 'import' | 'results';

const steps: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'scan', label: 'Security Scan' },
  { key: 'manifest', label: 'Manifest' },
  { key: 'compatibility', label: 'Compatibility' },
  { key: 'conflicts', label: 'Conflicts' },
  { key: 'dry_run', label: 'Dry Run' },
  { key: 'import', label: 'Import' },
  { key: 'results', label: 'Results' },
];

const mockSecurityScan = {
  checksum_valid: true,
  signature_valid: true,
  no_path_traversal: true,
  no_executables: true,
  no_zip_bomb: true,
  no_scripts: true,
  no_iframes: true,
  file_count: 24,
  total_size: 385000,
  warnings: [] as string[],
};

const mockManifest = {
  package_version: '3.2.0',
  source: 'Digital Footprint Email Studio',
  created: '2026-07-18T10:00:00Z',
  creator: 'admin@digitalfootprint.uk',
  modules: ['templates', 'brands', 'sections', 'translations'],
  counts: { templates: 5, brands: 2, sections: 8, translations: 12 },
  dependencies: ['brand_kit_acme', 'section_footer_legal'],
  compatibility_notes: 'Requires Email Studio 3.1.0+',
  excluded: ['contacts', 'recipients', 'provider_keys', 'tokens', 'delivery_logs'],
  checksums: { sha256: 'abc123...' },
};

const mockConflicts = [
  { id: 'c1', type: 'template', name: 'Welcome Email', existing: 'Draft v3', incoming: 'Package v4', resolution: 'pending' as const },
  { id: 'c2', type: 'brand', name: 'Acme Corp Brand Kit', existing: 'Active v2.1', incoming: 'Package v2.0', resolution: 'pending' as const },
  { id: 'c3', type: 'section', name: 'Footer — Legal', existing: 'Active v1', incoming: 'Package v1.1', resolution: 'pending' as const },
];

const mockDryRun = {
  to_create: 8,
  to_update_drafts: 2,
  to_skip: 3,
  conflicts: 1,
  missing_deps: 0,
  warnings: ['Template "Monthly Digest" contains external image URLs — review after import'],
  errors: [] as string[],
};

const mockImportResults = {
  created: 8,
  mapped_existing: 2,
  updated_drafts: 1,
  skipped: 2,
  failed: 0,
  warnings: ['2 external asset URLs require manual review'],
  assets_imported: 14,
  placeholders: 0,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cl: string }> = {
    pending: { label: 'Pending', cl: 'text-amber-400 bg-amber-400/10' },
    create_new: { label: 'Create New', cl: 'text-emerald-400 bg-emerald-400/10' },
    map_existing: { label: 'Map to Existing', cl: 'text-sky-400 bg-sky-400/10' },
    create_copy: { label: 'Create Copy', cl: 'text-violet-400 bg-violet-400/10' },
    skip: { label: 'Skip', cl: 'text-slate-400 bg-slate-400/10' },
    update_draft: { label: 'Update Draft', cl: 'text-sky-400 bg-sky-400/10' },
  };
  const info = map[status] || { label: status, cl: 'text-slate-400 bg-slate-400/10' };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${info.cl}`}>{info.label}</span>;
}

export default function ImportTemplatesPage() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, string>>({});
  const [importStarted, setImportStarted] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl p-8 text-center hover:border-[#06B6D4]/30 transition-colors">
              <FileArchive className="w-10 h-10 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-white font-semibold mb-2">Upload Email Studio Package</p>
              <p className="text-xs text-slate-500 mb-4">.zip format — versioned portable package</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
                <Upload className="w-4 h-4" /> Choose File
                <input type="file" accept=".zip" className="hidden" onChange={handleUpload} />
              </label>
              {fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-lg text-sm text-slate-300">
                  <FileArchive className="w-4 h-4 text-slate-500" />
                  {fileName}
                  <span className="text-xs text-slate-500">(385 KB)</span>
                </div>
              )}
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" /> What gets imported
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Templates, HTML & plain text</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Brand kits & reusable sections</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Translation variants</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Personalisation field references</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Campaign content snapshots</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automation definitions</div>
                <div className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400" /> No contacts or recipients</div>
                <div className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400" /> No provider keys or secrets</div>
              </div>
            </div>
          </div>
        );

      case 'scan':
        return (
          <div className="space-y-6">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Security Scan Passed</p>
                  <p className="text-xs text-emerald-400/70">All security checks completed successfully</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(mockSecurityScan).filter(([k]) => k.startsWith('no_') || k.endsWith('_valid')).map(([key]) => (
                  <div key={key} className="flex items-center gap-2 text-xs text-emerald-400/80">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {key.replace(/_/g, ' ').replace(/^no /, 'No ')}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span>{mockSecurityScan.file_count} files</span>
                <span>{(mockSecurityScan.total_size / 1024).toFixed(0)} KB total</span>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Rejected Content Policy</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {['Executable files', 'Unsafe SVG', 'Scripts & event handlers', 'Forms & iframes', 'JavaScript/data URLs', 'SQL statements', 'Path traversal attempts', 'Zip bombs'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-red-400/80">
                    <XCircle className="w-3.5 h-3.5" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'manifest':
        return (
          <div className="space-y-6">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Package Manifest
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="text-slate-500">Version:</span> <span className="text-white ml-2 font-mono">{mockManifest.package_version}</span></div>
                <div><span className="text-slate-500">Source:</span> <span className="text-white ml-2">{mockManifest.source}</span></div>
                <div><span className="text-slate-500">Created:</span> <span className="text-white ml-2">{mockManifest.created}</span></div>
                <div><span className="text-slate-500">Creator:</span> <span className="text-white ml-2">{mockManifest.creator}</span></div>
                <div><span className="text-slate-500">Checksum:</span> <span className="text-white ml-2 font-mono text-xs">{mockManifest.checksums.sha256}</span></div>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Modules & Counts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(mockManifest.counts).map(([key, count]) => (
                  <div key={key} className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-white">{count}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Dependencies</h3>
              <div className="flex flex-wrap gap-2">
                {mockManifest.dependencies.map((dep) => (
                  <span key={dep} className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-400 font-mono">{dep}</span>
                ))}
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Excluded Content</h3>
              <div className="flex flex-wrap gap-2">
                {mockManifest.excluded.map((ex) => (
                  <span key={ex} className="px-3 py-1.5 bg-red-500/5 border border-red-500/15 rounded-lg text-xs text-red-400/80">{ex.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'compatibility':
        return (
          <div className="space-y-6">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Compatible with Mapping</p>
                  <p className="text-xs text-emerald-400/70">Package can be imported — 2 items require mapping</p>
                </div>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Check</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-5 py-3 text-white text-xs">Package Version</td>
                    <td className="px-5 py-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">3.2.0 compatible with current 3.2.0</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-5 py-3 text-white text-xs">Enabled Modules</td>
                    <td className="px-5 py-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">All modules available</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-5 py-3 text-white text-xs">Editor Document Version</td>
                    <td className="px-5 py-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">Document schema v3 compatible</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-5 py-3 text-white text-xs">Merge Tags</td>
                    <td className="px-5 py-3"><AlertTriangle className="w-4 h-4 text-amber-400" /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">1 tag requires field mapping</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-5 py-3 text-white text-xs">Languages</td>
                    <td className="px-5 py-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">EN, FR, DE all supported</td>
                  </tr>
                  <tr className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="px-5 py-3 text-white text-xs">Asset Policy</td>
                    <td className="px-5 py-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">All asset types permitted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'conflicts':
        return (
          <div className="space-y-6">
            <p className="text-sm text-slate-400">Resolve conflicts before importing. Choose how to handle each conflicting item.</p>
            <div className="space-y-3">
              {mockConflicts.map((conflict) => (
                <div key={conflict.id} className="bg-[#121215] border border-amber-500/15 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{conflict.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{conflict.type}</p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-4 text-xs mb-4">
                    <span className="text-slate-400">Existing: <span className="text-slate-300">{conflict.existing}</span></span>
                    <span className="text-slate-600">vs</span>
                    <span className="text-slate-400">Incoming: <span className="text-slate-300">{conflict.incoming}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['create_new', 'map_existing', 'create_copy', 'skip', 'update_draft'] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() => setConflictResolutions((prev) => ({ ...prev, [conflict.id]: action }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          conflictResolutions[conflict.id] === action
                            ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                            : 'bg-white/[0.03] text-slate-400 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                        }`}
                      >
                        <StatusBadge status={action} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dry_run':
        return (
          <div className="space-y-6">
            <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-300">Dry Run Complete</p>
                  <p className="text-xs text-sky-400/70">No permanent records created — review before importing</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{mockDryRun.to_create}</p>
                <p className="text-xs text-slate-500 mt-1">Records to Create</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-sky-400">{mockDryRun.to_update_drafts}</p>
                <p className="text-xs text-slate-500 mt-1">Drafts to Update</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-400">{mockDryRun.to_skip}</p>
                <p className="text-xs text-slate-500 mt-1">To Skip</p>
              </div>
            </div>

            {mockDryRun.warnings.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-amber-300 mb-2">Warnings ({mockDryRun.warnings.length})</h4>
                {mockDryRun.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-400/80 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{w}</p>
                ))}
              </div>
            )}

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-white mb-2">Import Defaults</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>All imported content defaults to <span className="text-slate-300">Draft</span>, <span className="text-slate-300">Inactive</span> or <span className="text-slate-300">Needs Review</span></p>
                <p>No automatic approval, activation, scheduling or sending</p>
                <p>Import is transactional — rollback on critical failure</p>
              </div>
            </div>
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 text-center">
              {!importStarted ? (
                <>
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-white mb-2">Ready to Import</p>
                  <p className="text-xs text-slate-500 mb-6">This will create 8 records and update 2 Drafts. All content will default to Draft/Inactive.</p>
                  <button
                    onClick={() => setImportStarted(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4" /> Confirm Import
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Import Complete</p>
                  <p className="text-xs text-slate-500">All records created successfully</p>
                </>
              )}
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-300">Import Successful</p>
              </div>
              <p className="text-xs text-emerald-400/70">Imported content is in Draft/Inactive state — review before activating</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{mockImportResults.created}</p>
                <p className="text-xs text-slate-500 mt-1">Created</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-sky-400">{mockImportResults.mapped_existing}</p>
                <p className="text-xs text-slate-500 mt-1">Mapped</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-violet-400">{mockImportResults.updated_drafts}</p>
                <p className="text-xs text-slate-500 mt-1">Updated Drafts</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-400">{mockImportResults.skipped}</p>
                <p className="text-xs text-slate-500 mt-1">Skipped</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{mockImportResults.failed}</p>
                <p className="text-xs text-slate-500 mt-1">Failed</p>
              </div>
              <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{mockImportResults.assets_imported}</p>
                <p className="text-xs text-slate-500 mt-1">Assets</p>
              </div>
            </div>

            {mockImportResults.warnings.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-amber-300 mb-2">Post-Import Warnings</h4>
                {mockImportResults.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-400/80 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{w}</p>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/email/templates" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
                Review Imported Templates
              </Link>
              <Link href="/admin/email/portability" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
                Back to Portability
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
          <Upload className="w-4 h-4 text-[#06B6D4]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Import Wizard</h1>
          <Link href="/admin/email/portability" className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 mt-0.5">
            <ArrowLeft className="w-3 h-3" /> Back to Portability
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCurrentStep(step.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                i === stepIndex
                  ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                  : i < stepIndex
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.03] text-slate-600 border border-[rgba(255,255,255,0.04)]'
              }`}
            >
              {i < stepIndex && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
              {step.label}
            </button>
            {i < steps.length - 1 && <span className="text-slate-700 text-xs">→</span>}
          </div>
        ))}
      </div>

      {renderStep()}

      <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={() => {
            const prev = steps[stepIndex - 1];
            if (prev) setCurrentStep(prev.key);
          }}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#121215] border border-[rgba(255,255,255,0.08)] text-white text-sm rounded-xl hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-xs text-slate-500">Step {stepIndex + 1} of {steps.length}</span>
        <button
          onClick={() => {
            const next = steps[stepIndex + 1];
            if (next) setCurrentStep(next.key);
          }}
          disabled={stepIndex === steps.length - 1}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}