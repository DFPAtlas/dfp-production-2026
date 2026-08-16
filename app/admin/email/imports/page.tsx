'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from '@/components/motion'
import {
  Upload, FileText, ArrowLeft, CheckCircle2, X, AlertTriangle, Info, Download,
  ChevronRight, Database, Users, Search, RefreshCw, Clock, Ban,
} from 'lucide-react'
import type { ImportJob } from '@/components/admin/email/contacts/contacts-types'

type Step = 'upload' | 'map' | 'preview' | 'confirm' | 'results'

export default function ImportsPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState('')
  const [importMode, setImportMode] = useState<ImportJob['mode']>('add_new')
  const [rows, setRows] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [csvText, setCsvText] = useState('')

  const APPROVED_FIELDS = [
    { value: 'email', label: 'Email *', required: true },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'full_name', label: 'Full Name' },
    { value: 'company', label: 'Company' },
    { value: 'role', label: 'Role' },
    { value: 'phone', label: 'Phone' },
    { value: 'source', label: 'Source' },
    { value: 'tags', label: 'Tags' },
  ]

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('email_import_jobs').select('*').order('created_at', { ascending: false }).limit(30)
    if (data) setJobs(data as ImportJob[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return

    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (inQuotes) {
          if (char === '"') {
            if (line[i + 1] === '"') { current += '"'; i++ }
            else { inQuotes = false }
          } else { current += char }
        } else {
          if (char === '"') { inQuotes = true }
          else if (char === ',') { result.push(current); current = '' }
          else { current += char }
        }
      }
      result.push(current)
      return result
    }

    const neutralize = (value: string): string => {
      const trimmed = value.trim()
      if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
        return `'${trimmed}`
      }
      return trimmed
    }

    const h = parseLine(lines[0]).map(s => neutralize(s).replace(/^"|"$/g, ''))
    const r = lines.slice(1).map(line => parseLine(line).map(neutralize))
    setHeaders(h)
    setRows(r.slice(0, 50))
    const autoMap: Record<string, string> = {}
    h.forEach(col => {
      const lower = col.toLowerCase()
      if (lower.includes('email')) autoMap['email'] = col
      else if (lower.includes('first') && lower.includes('name')) autoMap['first_name'] = col
      else if (lower.includes('last') && lower.includes('name')) autoMap['last_name'] = col
      else if (lower === 'name' || lower === 'full_name') autoMap['full_name'] = col
      else if (lower.includes('company')) autoMap['company'] = col
      else if (lower.includes('role') || lower.includes('title')) autoMap['role'] = col
      else if (lower.includes('phone')) autoMap['phone'] = col
      else if (lower.includes('source')) autoMap['source'] = col
      else if (lower.includes('tag')) autoMap['tags'] = col
    })
    setFieldMapping(autoMap)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setStatusMsg({ type: 'error', text: 'Only CSV files are supported' })
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvText(text)
      parseCSV(text)
    }
    reader.readAsText(f)
  }

  const handleGoToMap = () => {
    if (!file && !csvText) {
      setStatusMsg({ type: 'error', text: 'Please select a CSV file' })
      return
    }
    setStep('map')
  }

  const handleGoToPreview = () => {
    if (!fieldMapping.email) {
      setStatusMsg({ type: 'error', text: 'Email field mapping is required' })
      return
    }
    setStep('preview')
  }

  const handleConfirmImport = async () => {
    setStep('confirm')
    const totalRows = rows.length
    let created = 0
    let skipped = 0
    let invalid = 0
    let suppressed = 0

    const emailIdx = headers.indexOf(fieldMapping.email)
    const nameIdx = fieldMapping.full_name ? headers.indexOf(fieldMapping.full_name) : fieldMapping.first_name ? headers.indexOf(fieldMapping.first_name) : -1
    const companyIdx = fieldMapping.company ? headers.indexOf(fieldMapping.company) : -1

    for (const row of rows) {
      const email = row[emailIdx]?.trim().toLowerCase()
      if (!email || !email.includes('@')) { invalid++; continue }

      const { data: existing } = await supabase.from('leads').select('id, do_not_contact, name, company_name').eq('email', email).maybeSingle()
      if (existing?.do_not_contact) { suppressed++; continue }

      const name = nameIdx >= 0 ? row[nameIdx] : email.split('@')[0]

      if (existing) {
        if (importMode === 'add_new' || importMode === 'add_to_audience') { skipped++; continue }
        await supabase.from('leads').update({
          name: importMode === 'add_update' ? (name || existing.name) : (existing.name || name),
          company_name: companyIdx >= 0 ? row[companyIdx] || existing.company_name : existing.company_name,
        }).eq('id', existing.id)
        created++
      } else {
        await supabase.from('leads').insert({
          email,
          name: name || email.split('@')[0],
          company_name: companyIdx >= 0 ? row[companyIdx] : null,
          source: source || 'import',
          consent_marketing: false,
          consent_contact: false,
          stage: 'new',
          priority: 'medium',
          status: 'new',
        })
        created++
      }
    }

    await supabase.from('email_import_jobs').insert({
      file_name: file?.name || 'manual.csv',
      file_size: file?.size || 0,
      source: source || 'import',
      mode: importMode,
      status: 'completed',
      total_rows: totalRows,
      created_count: created,
      skipped_count: skipped,
      invalid_count: invalid,
      suppressed_count: suppressed,
      result_summary: { created, skipped, invalid, suppressed },
      finished_at: new Date().toISOString(),
    })

    setJobs(prev => [{
      id: '', organisation_id: '', file_name: file?.name || '', file_size: file?.size || 0,
      column_mapping: fieldMapping, audience_id: null, brand_id: null, source: source || 'import',
      consent_info: {}, mode: importMode, status: 'completed', total_rows: totalRows,
      created_count: created, updated_count: 0, skipped_count: skipped,
      invalid_count: invalid, suppressed_count: suppressed, failed_count: 0,
      result_summary: { created, skipped, invalid, suppressed },
      created_by: null, created_at: new Date().toISOString(), finished_at: new Date().toISOString(),
    } as ImportJob, ...prev])

    setStep('results')
  }

  const resetWizard = () => { setStep('upload'); setFile(null); setRows([]); setHeaders([]); setFieldMapping({}); setCsvText(''); setSource(''); setImportMode('add_new') }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      running: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    }
    return map[status] || map.pending
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <AnimatePresence>
        {statusMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-red-500/[0.06] text-red-400 border-red-500/20'}`}>
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <Link href="/admin/email/contacts" className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Import Contacts</h1>
          <p className="text-sm text-slate-400 mt-1">Upload a CSV file to add contacts to your email lists.</p>
        </div>
      </div>

      {step === 'upload' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 space-y-6">
          <div className="border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl p-10 text-center hover:border-[#06B6D4]/30 transition-colors">
            <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Upload CSV File</p>
            <p className="text-xs text-slate-500 mb-4">Drag and drop or click to browse</p>
            <input type="file" accept=".csv" onChange={handleFileChange}
              className="block mx-auto text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#06B6D4] file:text-white hover:file:bg-[#0891B2] cursor-pointer" />
            {file && <p className="text-xs text-emerald-400 mt-2">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Source</label>
              <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Event signups, website forms"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Import Mode</label>
              <select value={importMode} onChange={e => setImportMode(e.target.value as ImportJob['mode'])}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                <option value="add_new">Add new only (skip existing)</option>
                <option value="add_fill_blanks">Add and fill blank fields</option>
                <option value="add_update">Add and update mapped fields</option>
                <option value="add_to_audience">Add to audience without changing details</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleGoToMap} disabled={!file && !csvText}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
              Map Fields <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white">Map CSV Columns</h3>
          <div className="space-y-3">
            {APPROVED_FIELDS.map(f => (
              <div key={f.value} className="flex items-center gap-4">
                <span className="w-32 text-xs text-slate-400 shrink-0">{f.label} {f.required && <span className="text-red-400">*</span>}</span>
                <select value={fieldMapping[f.value] || ''} onChange={e => {
                  const val = e.target.value
                  setFieldMapping(prev => {
                    const next = { ...prev }
                    if (val) next[f.value] = val
                    else delete next[f.value]
                    return next
                  })
                }}
                  className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                  <option value="">-- Skip --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep('upload')} className="px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/[0.08] cursor-pointer">Back</button>
            <button onClick={handleGoToPreview} className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] cursor-pointer">
              Preview <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-semibold text-white">Preview Import</h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Rows', value: rows.length, color: 'text-slate-400' },
              { label: 'Valid New', value: rows.length, color: 'text-emerald-400' },
              { label: 'Suppressed', value: 0, color: 'text-red-400' },
              { label: 'Invalid', value: rows.filter(r => !r[headers.indexOf(fieldMapping.email)]?.includes('@')).length, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto border border-[rgba(255,255,255,0.06)] rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  {headers.map(h => <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 text-slate-300 truncate max-w-[150px]">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('map')} className="px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/[0.08] cursor-pointer">Back</button>
            <button onClick={handleConfirmImport} className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] cursor-pointer">
              Confirm & Import
            </button>
          </div>
        </div>
      )}

      {(step === 'confirm' || step === 'results') && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Import Complete</h3>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-white/[0.02] rounded-xl p-3"><p className="text-xl font-bold text-white">{jobs[0]?.created_count || 0}</p><p className="text-[10px] text-slate-500">Created</p></div>
            <div className="bg-white/[0.02] rounded-xl p-3"><p className="text-xl font-bold text-white">{jobs[0]?.skipped_count || 0}</p><p className="text-[10px] text-slate-500">Skipped</p></div>
            <div className="bg-white/[0.02] rounded-xl p-3"><p className="text-xl font-bold text-amber-400">{jobs[0]?.invalid_count || 0}</p><p className="text-[10px] text-slate-500">Invalid</p></div>
            <div className="bg-white/[0.02] rounded-xl p-3"><p className="text-xl font-bold text-red-400">{jobs[0]?.suppressed_count || 0}</p><p className="text-[10px] text-slate-500">Suppressed</p></div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={resetWizard} className="px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-semibold hover:bg-white/[0.08] cursor-pointer">Import Another</button>
            <Link href="/admin/email/contacts" className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] cursor-pointer">View Contacts</Link>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-white">Import History</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No import history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">File</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden sm:table-cell">Rows</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden sm:table-cell">Created</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td className="px-4 py-3 text-sm text-white">{j.file_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] border ${getStatusBadge(j.status)}`}>{j.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-400 hidden sm:table-cell">{j.total_rows}</td>
                      <td className="px-4 py-3 text-center text-xs text-emerald-400 hidden sm:table-cell">{j.created_count}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">{j.created_at ? new Date(j.created_at).toLocaleDateString('en-GB') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
