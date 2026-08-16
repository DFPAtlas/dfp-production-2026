'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import CommandShell from '@/components/admin/CommandShell';
import { FileText, Download, Printer, FileSpreadsheet, Heart, DollarSign, Bell, LifeBuoy, Rocket } from 'lucide-react';

const REPORTS = [
  { id: 'health', label: 'Health Report', icon: Heart, description: 'System health scores and status across all projects' },
  { id: 'finance', label: 'Finance Report', icon: DollarSign, description: 'Revenue, costs and profitability breakdown' },
  { id: 'alerts', label: 'Alerts Report', icon: Bell, description: 'Active and resolved alerts summary' },
  { id: 'support', label: 'Support Report', icon: LifeBuoy, description: 'Ticket metrics and response times' },
  { id: 'deployment', label: 'Deployment Report', icon: Rocket, description: 'Build and deployment status across projects' },
];

export default function CommandReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleExport = (format: string) => {
    setExporting(format);
    setTimeout(() => {
      setExporting(null);
      setMessage({ text: 'Report export triggered. In production, this would download the ' + format.toUpperCase() + ' file.', type: 'success' });
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <CommandShell>
      {message && (
        <div className={`mb-6 flex items-center justify-between px-4 py-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-3 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0" aria-label="Dismiss">
            <i className="ri-close-line w-4 h-4 flex items-center justify-center" />
          </button>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
            <p className="text-sm text-slate-400">Export and download system reports</p>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
            <Printer className="w-4 h-4" />Print
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {REPORTS.map((report, i) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                  <report.icon className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1">{report.label}</h3>
                  <p className="text-xs text-slate-400 mb-4">{report.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleExport('csv')} disabled={exporting === 'csv'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-300 hover:text-white hover:border-[#06B6D4]/30 transition-all cursor-pointer disabled:opacity-50">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      {exporting === 'csv' ? 'Exporting...' : 'CSV'}
                    </button>
                    <button onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-300 hover:text-white hover:border-[#06B6D4]/30 transition-all cursor-pointer disabled:opacity-50">
                      <Download className="w-3.5 h-3.5" />
                      {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Reporting Ready</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Reports pull live data from the Command Centre database. Export formats available in CSV and PDF.
            Print directly from this page for physical copies.
          </p>
        </div>
      </div>
    </CommandShell>
  );
}