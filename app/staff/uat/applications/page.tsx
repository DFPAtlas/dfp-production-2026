'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getSessionSafe } from '@/lib/supabase';
import StaffShell from '@/components/staff/StaffShell';
import { APPLICATION_STATUS_CONFIG, type ApplicationStatus } from '@/lib/uat-application-types';
import {
  Search, Eye, Download, CheckCircle2, XCircle, Clock3, AlertTriangle,
  Loader2, UserX, FileText, Tag, Star, Bug, BarChart3,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
  { key: 'waitlisted', label: 'Waitlisted' },
];

export default function StaffApplicationsPage() {
  return (
    <StaffShell>
      <StaffApplicationsContent />
    </StaffShell>
  );
}

function StaffApplicationsContent() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [noteFeedback, setNoteFeedback] = useState('');
  const [bugScoreOverride, setBugScoreOverride] = useState<number | null>(null);
  const [scoreOverrideFeedback, setScoreOverrideFeedback] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('uat_tester_applications').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      q = q.or(`legal_name.ilike.%${s}%,email.ilike.%${s}%,application_reference.ilike.%${s}%`);
    }
    const { data } = await q.limit(100);
    setApplications(data || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const totals = {
    all: applications.length,
    submitted: applications.filter((a) => a.status === 'submitted').length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    declined: applications.filter((a) => a.status === 'declined').length,
    waitlisted: applications.filter((a) => a.status === 'waitlisted').length,
  };

  const viewDetail = async (app: any) => {
    setSelectedApp(app);
    setStaffNotes(app.staff_notes || '');
    setNoteFeedback('');
    setBugScoreOverride(app.practical_bug_report_score ?? null);
    setScoreOverrideFeedback('');
    setPdfUrl(null);
    if (app.terms_acceptance_id) {
      try {
        const { data: acc } = await supabase.from('uat_terms_acceptances').select('pdf_storage_path').eq('id', app.terms_acceptance_id).maybeSingle();
        if (acc?.pdf_storage_path) {
          const { data: signed } = await supabase.storage.from('uat-legal-agreements').createSignedUrl(acc.pdf_storage_path, 3600);
          if (signed?.signedUrl) setPdfUrl(signed.signedUrl);
        }
      } catch {}
    }
  };

  const sendStatusEmail = async (app: any, newStatus: ApplicationStatus) => {
    const appData = app.application_data || {};
    const name = app.legal_name || appData.legalName || 'Tester';
    const email = app.email || appData.email;
    const ref = app.application_reference || 'N/A';
    if (!email) return;

    const statusMessages: Record<string, { subject: string; heading: string; body: string; colour: string }> = {
      approved: {
        subject: `DFP UAT — Your application has been approved — ${ref}`,
        heading: 'Application Approved',
        body: `Congratulations ${name}, your application to become a DFP UAT Tester has been <strong>approved</strong>. Our team will be in touch soon with onboarding details and your first testing opportunities.`,
        colour: '#10B981',
      },
      declined: {
        subject: `DFP UAT — Update on your application — ${ref}`,
        heading: 'Application Update',
        body: `Hi ${name}, thank you for your interest in becoming a DFP UAT Tester. After careful review we are unable to progress your application at this time. We may reach out if future opportunities match your profile.`,
        colour: '#EF4444',
      },
      waitlisted: {
        subject: `DFP UAT — You have been waitlisted — ${ref}`,
        heading: 'Application Waitlisted',
        body: `Hi ${name}, your application has been <strong>waitlisted</strong>. This means we are interested but do not have an immediate opening that matches your profile. We will contact you when a suitable opportunity becomes available.`,
        colour: '#06B6D4',
      },
      under_review: {
        subject: `DFP UAT — Your application is under review — ${ref}`,
        heading: 'Application Under Review',
        body: `Hi ${name}, your application is now being reviewed by our team. We will update you as soon as a decision is made.`,
        colour: '#F59E0B',
      },
      more_information_required: {
        subject: `DFP UAT — Additional information requested — ${ref}`,
        heading: 'More Information Needed',
        body: `Hi ${name}, our team needs some additional information before we can complete our review. Please check your tester portal or email for details about what is needed.`,
        colour: '#F59E0B',
      },
    };

    const msg = statusMessages[newStatus];
    if (!msg) return;

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fbfcff;border-radius:12px">
      <div style="background:${msg.colour};padding:32px;border-radius:10px;text-align:center;margin-bottom:24px">
        <h2 style="color:#fff;margin:0;font-size:22px">${msg.heading}</h2>
      </div>
      <p style="color:#17325c;font-size:15px;line-height:1.6">${msg.body}</p>
      <div style="background:#f0f4ff;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0;color:#2878d0;font-size:13px;font-weight:bold">Application Reference</p>
        <p style="margin:8px 0 0;color:#17325c;font-size:16px;font-weight:bold">${ref}</p>
      </div>
      <p style="color:#5a6e8a;font-size:13px;line-height:1.5">If you have any questions, please contact <a href="mailto:uat@digital-footprint.uk" style="color:#2878d0">uat@digital-footprint.uk</a>.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
      <p style="color:#94a3b8;font-size:11px">Digital Footprint · London, UK</p>
    </div>`;

    try { await supabase.functions.invoke('send-email', { body: { to: email, subject: msg.subject, html } }); } catch {}
  };

  const updateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setActionLoading(appId);
    try {
      const payload: any = { status: newStatus, reviewed_at: new Date().toISOString(), reviewed_by: (await getSessionSafe())?.user?.id, updated_at: new Date().toISOString() };
      const app = applications.find((a) => a.id === appId);
      if (newStatus === 'approved') {
        if (app) {
          const testerRef = `DFP-UAT-TST-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
          await supabase.from('uat_testers').insert({
            user_id: app.user_id, full_name: app.legal_name || app.application_data?.legalName || 'Unknown',
            email: app.email, reference: testerRef, status: 'active', onboarding_status: 'approved',
            preferred_payment_method: app.application_data?.preferredPaymentMethod || null,
          }).select('id').single();
        }
        if (app?.generated_tags && app.generated_tags.length > 0) {
          for (const tag of app.generated_tags) {
            await supabase.from('uat_tester_tags').insert({ tester_id: app.user_id, tag, source: 'auto' });
          }
        }
      }
      await supabase.from('uat_tester_applications').update(payload).eq('id', appId);
      if (app) sendStatusEmail(app, newStatus);
      fetchApplications();
      if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: newStatus, ...payload });
    } catch {}
    setActionLoading(null);
  };

  const saveNotes = async () => {
    if (!selectedApp) return;
    try {
      await supabase.from('uat_tester_applications').update({ staff_notes: staffNotes, updated_at: new Date().toISOString() }).eq('id', selectedApp.id);
      setNoteFeedback('Notes saved.');
      setTimeout(() => setNoteFeedback(''), 2000);
    } catch { setNoteFeedback('Failed to save notes.'); }
  };

  const saveBugScoreOverride = async () => {
    if (!selectedApp || bugScoreOverride === null) return;
    try {
      await supabase.from('uat_tester_applications').update({
        practical_bug_report_score: bugScoreOverride,
        practical_bug_report_reviewed_by: (await getSessionSafe())?.user?.id,
        practical_bug_report_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedApp.id);
      setScoreOverrideFeedback('Score saved.');
      setTimeout(() => setScoreOverrideFeedback(''), 2000);
    } catch { setScoreOverrideFeedback('Failed to save.'); }
  };

  const requestMoreInfo = async (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    await supabase.from('uat_tester_applications').update({
      status: 'more_information_required', reviewed_at: new Date().toISOString(),
      reviewed_by: (await getSessionSafe())?.user?.id, updated_at: new Date().toISOString(),
    }).eq('id', appId);
    if (app) sendStatusEmail(app, 'more_information_required');
    fetchApplications();
    if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: 'more_information_required' });
  };

  const appData = selectedApp?.application_data || {};
  const bugReport = appData.practicalBugReport || {};
  const autoScore = selectedApp?.practical_bug_report_score;
  const tags = selectedApp?.generated_tags || [];
  const industries = appData.industryExperience || [];
  const devices = appData.devices || [];
  const deviceProfiles = appData.deviceProfiles || [];
  const testEnvs = appData.testEnvironments || [];

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">UAT Applications</p>
        <h1 className="text-2xl font-bold text-white mt-1">Tester Applications</h1>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATUS_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`rounded-xl px-4 py-3 text-sm font-semibold transition border whitespace-nowrap cursor-pointer ${statusFilter === tab.key ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.2)]'}`}>
              {tab.label} <span className="ml-1.5 text-xs opacity-60">{(totals as any)[tab.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or reference..." className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-[#06B6D4] animate-spin" /></div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20"><FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No applications found.</p></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_460px]">
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} onClick={() => viewDetail(app)} className={`rounded-xl border p-4 cursor-pointer transition ${selectedApp?.id === app.id ? 'border-[#06B6D4]/40 bg-[#06B6D4]/5' : 'border-[rgba(255,255,255,0.08)] bg-[#1E293B] hover:border-[rgba(255,255,255,0.15)]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{app.legal_name || app.application_data?.legalName || 'Unnamed'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{app.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus]?.bg || 'bg-slate-500/10'} ${APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus]?.text || 'text-slate-400'}`}>
                      {APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus]?.label || app.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{app.application_reference}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                  <span>Exp: {app.application_data?.experienceLevel || '—'}</span>
                  <span>Devices: {app.application_data?.devices?.length || 0}</span>
                  <span>Industries: {(app.application_data?.industryExperience || []).length}</span>
                  <span>Bug: {app.practical_bug_report_score != null ? `${app.practical_bug_report_score}/5` : '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedApp && (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1E293B] p-5 h-fit sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white text-lg">Application Detail</h2>
                <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white transition cursor-pointer"><XCircle className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                <DetailSection title="Personal Details">
                  <DetailRow label="Legal Name" value={selectedApp.legal_name || appData.legalName} />
                  <DetailRow label="Display Name" value={appData.displayName} />
                  <DetailRow label="Email" value={selectedApp.email || appData.email} />
                  <DetailRow label="Mobile" value={appData.mobile} />
                  <DetailRow label="Location" value={[appData.townCity, appData.county, appData.postcode].filter(Boolean).join(', ') || appData.country} />
                </DetailSection>

                <DetailSection title="Experience & Industry">
                  <DetailRow label="Level" value={appData.experienceLevel} />
                  <DetailRow label="Tested Before" value={appData.hasTestedBefore} />
                  <DetailRow label="Confidence" value={appData.techConfidence} />
                  <DetailRow label="Work Area" value={appData.relevantWorkArea} />
                  <DetailRow label="Motivation" value={appData.motivation ? appData.motivation.slice(0, 100) : ''} />
                </DetailSection>

                {industries.length > 0 && (
                  <DetailSection title="Industry Knowledge">
                    {industries.filter((ie: any) => ie.industry !== 'No specialist industry experience').map((ie: any) => (
                      <DetailRow key={ie.industry} label={ie.industry} value={`${ie.confidence || '—'} — via ${ie.source || '—'}`} />
                    ))}
                    {industries.filter((ie: any) => ie.industry !== 'No specialist industry experience').length === 0 && (
                      <p className="text-xs text-slate-500">No specialist industry experience</p>
                    )}
                  </DetailSection>
                )}

                <DetailSection title="Devices & Environment">
                  <DetailRow label="Devices" value={devices.join(', ')} />
                  <DetailRow label="Browsers" value={(appData.browsers || []).join(', ')} />
                  <DetailRow label="Internet" value={(appData.internetConnection || []).join(', ')} />
                  <DetailRow label="Conditions" value={testEnvs.length > 0 ? `${testEnvs.length} selected` : '—'} />
                  {deviceProfiles.filter((dp: any) => dp.manufacturer || dp.model).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Device Details</p>
                      {deviceProfiles.filter((dp: any) => dp.manufacturer || dp.model).map((dp: any) => (
                        <div key={dp.deviceLabel} className="text-[10px] text-slate-400 mb-1">{dp.deviceLabel}: {[dp.manufacturer, dp.model, dp.osVersion].filter(Boolean).join(' — ')}</div>
                      ))}
                    </div>
                  )}
                  <DetailRow label="Restrictions" value={appData.deviceRestrictions} />
                </DetailSection>

                <DetailSection title="Testing Skills">
                  <DetailRow label="Activities" value={(appData.testingActivities || []).join(', ')} />
                  <DetailRow label="Strengths" value={(appData.testerStrengths || []).join(', ')} />
                  <DetailRow label="Level" value={appData.preferredTestingLevel} />
                </DetailSection>

                {bugReport.bugTitle && (
                  <DetailSection title="Practical Bug Report">
                    <div className="space-y-2 text-xs">
                      <div><span className="text-slate-500">Title:</span> <span className="text-slate-300">{bugReport.bugTitle}</span></div>
                      <div><span className="text-slate-500">Steps:</span> <span className="text-slate-300">{bugReport.stepsToReproduce}</span></div>
                      <div><span className="text-slate-500">Expected:</span> <span className="text-slate-300">{bugReport.expectedResult}</span></div>
                      <div><span className="text-slate-500">Actual:</span> <span className="text-slate-300">{bugReport.actualResult}</span></div>
                      <div><span className="text-slate-500">Device:</span> <span className="text-slate-300">{bugReport.deviceBrowser}</span></div>
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.06)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Bug className="h-3.5 w-3.5 text-amber-400" /> Bug Report Score</span>
                        <span className="text-xs font-bold text-amber-400">{autoScore != null ? `${autoScore}/5` : 'Unscored'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={bugScoreOverride ?? ''}
                          onChange={(e) => setBugScoreOverride(e.target.value ? parseInt(e.target.value) : null)}
                          className="flex-1 px-3 py-2 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer"
                        >
                          <option value="">Auto ({autoScore != null ? autoScore : '—'})</option>
                          {[0, 1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s} — {s === 0 ? 'Incomplete' : s === 1 ? 'Basic' : s === 2 ? 'Understandable' : s === 3 ? 'Clear & reproducible' : s === 4 ? 'Strong detail' : 'Professional quality'}</option>)}
                        </select>
                        <button onClick={saveBugScoreOverride} className="px-3 py-2 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-xs text-[#06B6D4] hover:bg-[#06B6D4]/20 transition whitespace-nowrap cursor-pointer">Save</button>
                      </div>
                      {scoreOverrideFeedback && <p className="text-[10px] text-emerald-400 mt-1.5">{scoreOverrideFeedback}</p>}
                    </div>
                  </DetailSection>
                )}

                <DetailSection title="Perspectives & Accessibility">
                  <DetailRow label="Perspectives" value={(appData.userPerspectives || []).join(', ')} />
                  <DetailRow label="Accessibility" value={appData.accessibilityInterest} />
                  <DetailRow label="Capabilities" value={(appData.accessibilityCapabilities || []).join(', ')} />
                  <DetailRow label="Tools" value={appData.accessibilityTools} />
                  <DetailRow label="Conflict" value={appData.projectConflictStatus} />
                  {appData.projectConflictDetails && <DetailRow label="Conflict Detail" value={appData.projectConflictDetails} />}
                </DetailSection>

                <DetailSection title="Availability & Communication">
                  <DetailRow label="Hours" value={appData.availabilityHours} />
                  <DetailRow label="Days" value={(appData.availabilityDays || []).join(', ')} />
                  <DetailRow label="Times" value={(appData.availabilityTimes || []).join(', ')} />
                  <DetailRow label="Response" value={appData.responseSpeed} />
                  <DetailRow label="Methods" value={(appData.communicationMethods || []).join(', ')} />
                  <DetailRow label="Session" value={appData.preferredSessionLength} />
                  <DetailRow label="Notice" value={appData.noticeRequired} />
                </DetailSection>

                {tags.length > 0 && (
                  <DetailSection title="Generated Matching Tags">
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t: string) => (
                        <span key={t} className="inline-flex items-center rounded-full bg-[#06B6D4]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#06B6D4] border border-[#06B6D4]/20">{t}</span>
                      ))}
                    </div>
                  </DetailSection>
                )}

                <DetailSection title="Payment">
                  <DetailRow label="Method" value={appData.preferredPaymentMethod} />
                </DetailSection>

                <DetailSection title="Agreement">
                  <DetailRow label="Terms" value={selectedApp.terms_acceptance_id ? 'Accepted' : 'Not accepted'} />
                  <DetailRow label="Submitted" value={selectedApp.submitted_at ? new Date(selectedApp.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#06B6D4] hover:underline"><Download className="h-3.5 w-3.5" /> Download Signed PDF</a>
                  )}
                </DetailSection>

                <div className="rounded-xl bg-[#0F172A]/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Staff Notes</h3>
                  <textarea value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} rows={3} placeholder="Internal notes..." className="w-full px-3 py-2 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 resize-none" />
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={saveNotes} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Save Notes</button>
                    {noteFeedback && <span className="text-xs text-emerald-400">{noteFeedback}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => updateStatus(selectedApp.id, 'under_review')} disabled={actionLoading === selectedApp.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-3 py-2 text-xs font-semibold text-[#06B6D4] hover:bg-[#06B6D4]/20 transition whitespace-nowrap cursor-pointer disabled:opacity-50"><Eye className="h-3.5 w-3.5" /> Review</button>
                  <button onClick={() => updateStatus(selectedApp.id, 'approved')} disabled={actionLoading === selectedApp.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition whitespace-nowrap cursor-pointer disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>
                  <button onClick={() => requestMoreInfo(selectedApp.id)} disabled={actionLoading === selectedApp.id} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition whitespace-nowrap cursor-pointer disabled:opacity-50"><AlertTriangle className="h-3.5 w-3.5" /> More Info</button>
                  <button onClick={() => updateStatus(selectedApp.id, 'waitlisted')} disabled={actionLoading === selectedApp.id} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition whitespace-nowrap cursor-pointer disabled:opacity-50"><Clock3 className="h-3.5 w-3.5" /> Waitlist</button>
                  <button onClick={() => updateStatus(selectedApp.id, 'declined')} disabled={actionLoading === selectedApp.id} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition whitespace-nowrap cursor-pointer disabled:opacity-50"><UserX className="h-3.5 w-3.5" /> Decline</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0F172A]/50 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-slate-300 text-right break-words max-w-[60%]">{value}</span>
    </div>
  );
}