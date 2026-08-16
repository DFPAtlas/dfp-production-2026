'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Download, FileArchive, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, ArrowLeft, ShieldCheck, Search, FileText,
  Package, Eye, HardDrive,
} from 'lucide-react';

type Step = 'type' | 'select' | 'dependencies' | 'assets' | 'sanitise' | 'validate' | 'confirm' | 'ready';

const steps: { key: Step; label: string }[] = [
  { key: 'type', label: 'Export Type' },
  { key: 'select', label: 'Select Records' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'assets', label: 'Assets' },
  { key: 'sanitise', label: 'Sanitisation' },
  { key: 'validate', label: 'Validate' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'ready', label: 'Download' },
];

const exportTypes = [
  { id: 'template_family', label: 'Template Family', desc: 'Single template or family of related templates', icon: FileText },
  { id: 'brand_kit', label: 'Brand Kit & Sections', desc: 'Brand assets, reusable sections and styles', icon: Package },
  { id: 'product_bundle', label: 'Product Email Bundle', desc: 'Complete set of email templates for a product', icon: Package },
  { id: 'campaign_content', label: 'Campaign Content', desc: 'Campaign content snapshot without recipients', icon: FileText },
  { id: 'automation', label: 'Automation Definitions', desc: 'Automation definitions without secrets', icon: FileText },
  { id: 'transactional', label: 'Transactional Mappings', desc: 'Transactional mappings without credentials', icon: FileText },
  { id: 'config', label: 'Studio Configuration', desc: 'Organisation Email Studio configuration', icon: Package },
  { id: 'backup', label: 'Backup Snapshot', desc: 'Full logical backup excluding contacts and secrets', icon: HardDrive },
];

const mockTemplates = [
  { id: 'tpl-1', name: 'Welcome Email', category: 'onboarding', selected: true },
  { id: 'tpl-2', name: 'Monthly Digest', category: 'newsletter', selected: true },
  { id: 'tpl-3', name: 'Password Reset', category: 'transactional', selected: false },
  { id: 'tpl-4', name: 'Order Confirmation', category: 'transactional', selected: false },
  { id: 'tpl-5', name: 'Abandoned Cart', category: 'marketing', selected: true },
];

const mockDependencies = [
  { id: 'dep-1', name: 'Acme Corp Brand Kit', type: 'brand', action: 'include' as const, required: true },
  { id: 'dep-2', name: 'Footer — Legal Section', type: 'section', action: 'include' as const, required: true },
  { id: 'dep-3', name: 'Header — Navigation', type: 'section', action: 'reference' as const, required: false },
  { id: 'dep-4', name: 'Product Images CDN', type: 'asset', action: 'exclude' as const, required: false },
];

const mockSanitisation = {
  removed: ['Database IDs (12)', 'Storage paths (8)', 'User IDs (3)', 'Internal comments (2)'],
  replaced: ['Environment URLs → placeholders (4)', 'Sample data → test values (6)'],
  preserved: ['Public links (15)', 'Brand assets (22)', 'Merge tags (8)', 'Legal content (3)'],
};

const mockValidation = {
  checks_passed: 18,
  checks_total: 18,
  warnings: [] as string[],
  errors: [] as string[],
  size_estimate: '284 KB',
  record_count: 12,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cl: string }> = {
    include: { label: 'Include', cl: 'text-emerald-400 bg-emerald-400/10' },
    reference: { label: 'Reference', cl: 'text-sky-400 bg-sky-400/10' },
    exclude: { label: 'Exclude', cl: 'text-slate-400 bg-slate-400/10' },
    placeholder: { label: 'Placeholder', cl: 'text-amber-400 bg-amber-400/10' },
  };
  const info = map[status] || { label: status, cl: 'text-slate-400 bg-slate-400/10' };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${info.cl}`}>{info.label}</span>;
}

export default function ExportsPage() {
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState(mockTemplates);
  const [depActions, setDepActions] = useState(mockDependencies);
  const [packageReady, setPackageReady] = useState(false);

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setCurrentStep('select'); }}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedType === type.id
                    ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30'
                    : 'bg-[#121215] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <type.icon className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-white mb-1">{type.label}</p>
                <p className="text-xs text-slate-500">{type.desc}</p>
              </button>
            ))}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter templates..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1">
                {selectedTemplates.map((tpl) => (
                  <label key={tpl.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={tpl.selected}
                      onChange={() => toggleTemplate(tpl.id)}
                      className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent accent-[#06B6D4]"
                    />
                    <div>
                      <p className="text-sm text-white">{tpl.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{tpl.category}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                {selectedTemplates.filter((t) => t.selected).length} of {selectedTemplates.length} selected
              </p>
            </div>
          </div>
        );

      case 'dependencies':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Review detected dependencies. Required dependencies cannot be excluded.</p>
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Dependency</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Type</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Required</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {depActions.map((dep) => (
                    <tr key={dep.id} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="px-5 py-3 text-white text-xs">{dep.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs capitalize">{dep.type}</td>
                      <td className="px-5 py-3">{dep.required ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-xs text-slate-600">—</span>}</td>
                      <td className="px-5 py-3"><StatusBadge status={dep.action} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Choose how to handle assets in the export package.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="p-5 bg-[#121215] border border-[#06B6D4]/30 rounded-2xl text-left cursor-pointer hover:border-[#06B6D4]/50 transition-all">
                <FileArchive className="w-8 h-8 text-[#06B6D4] mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Embed Assets</p>
                <p className="text-xs text-slate-500">Include assets directly in the package (increases size)</p>
              </button>
              <button className="p-5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl text-left cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-all">
                <Eye className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Reference URLs</p>
                <p className="text-xs text-slate-500">Keep public URL references (requires connectivity)</p>
              </button>
              <button className="p-5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl text-left cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-all">
                <XCircle className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Placeholders</p>
                <p className="text-xs text-slate-500">Use placeholders — replace during import</p>
              </button>
            </div>
          </div>
        );

      case 'sanitise':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-red-300 mb-3 flex items-center gap-2"><XCircle className="w-3.5 h-3.5" /> Removed</h4>
                <ul className="space-y-1.5">
                  {mockSanitisation.removed.map((item, i) => (
                    <li key={i} className="text-xs text-red-400/80">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-amber-300 mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Replaced</h4>
                <ul className="space-y-1.5">
                  {mockSanitisation.replaced.map((item, i) => (
                    <li key={i} className="text-xs text-amber-400/80">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-emerald-300 mb-3 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Preserved</h4>
              <div className="flex flex-wrap gap-2">
                {mockSanitisation.preserved.map((item, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-500/10 rounded-lg text-xs text-emerald-400">{item}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'validate':
        return (
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Validation Passed</p>
                  <p className="text-xs text-emerald-400/70">{mockValidation.checks_passed}/{mockValidation.checks_total} checks passed</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-lg font-bold text-white">{mockValidation.record_count}</p><p className="text-[10px] text-slate-500">Records</p></div>
                <div><p className="text-lg font-bold text-white">{mockValidation.size_estimate}</p><p className="text-[10px] text-slate-500">Est. Size</p></div>
                <div><p className="text-lg font-bold text-white">{mockValidation.checks_total}</p><p className="text-[10px] text-slate-500">Checks</p></div>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-white mb-3">Sanitisation Report</h4>
              <div className="text-xs text-slate-400 space-y-1">
                {mockSanitisation.removed.map((r, i) => <p key={i} className="text-red-400/70">Removed: {r}</p>)}
                {mockSanitisation.replaced.map((r, i) => <p key={i} className="text-amber-400/70">Replaced: {r}</p>)}
              </div>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-slate-400" /> Export Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="text-slate-500">Type:</span> <span className="text-white ml-2">Template Family</span></div>
                <div><span className="text-slate-500">Records:</span> <span className="text-white ml-2">3 templates selected</span></div>
                <div><span className="text-slate-500">Dependencies:</span> <span className="text-white ml-2">4 detected</span></div>
                <div><span className="text-slate-500">Assets:</span> <span className="text-white ml-2">Embedded</span></div>
                <div><span className="text-slate-500">Est. Size:</span> <span className="text-white ml-2">284 KB</span></div>
                <div><span className="text-slate-500">Package Format:</span> <span className="text-white ml-2">Versioned ZIP v3.2.0</span></div>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-white mb-2">Excluded by Policy</h4>
              <div className="flex flex-wrap gap-2">
                {['Contacts', 'Recipients', 'Provider Keys', 'Tokens', 'Delivery Logs', 'Consent Records'].map((item) => (
                  <span key={item} className="px-3 py-1.5 bg-red-500/5 border border-red-500/15 rounded-lg text-xs text-red-400/80">{item}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setPackageReady(true); setCurrentStep('ready'); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" /> Create Export Package
            </button>
          </div>
        );

      case 'ready':
        return (
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-300 mb-2">Package Ready</p>
              <p className="text-xs text-slate-500 mb-6">email-studio-export-welcome-series-v1.zip — 284 KB</p>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
                <Download className="w-4 h-4" /> Download Package
              </button>
              <p className="text-xs text-slate-600 mt-3">Link expires in 24 hours · Signed download · Audit logged</p>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-white mb-2">Package Structure</h4>
              <div className="font-mono text-xs text-slate-400 space-y-0.5">
                <p>manifest.json</p>
                <p>templates/ (3 files)</p>
                <p>brands/ (1 file)</p>
                <p>sections/ (2 files)</p>
                <p>translations/ (6 files)</p>
                <p>assets/ (12 files)</p>
                <p>checksums.sha256</p>
                <p>README.txt</p>
              </div>
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
          <Download className="w-4 h-4 text-[#06B6D4]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Export Wizard</h1>
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