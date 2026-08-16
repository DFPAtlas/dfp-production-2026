import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Gauge, MessageCircle, Play, Send, WalletCards } from 'lucide-react';
import { dashboardStats, demoAssignments, demoReports } from '@/lib/uatDemoData';

const statusTone: Record<string, string> = {
  'Pending review': 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Duplicate: 'bg-sky-100 text-sky-700',
  'Needs evidence': 'bg-rose-100 text-rose-700',
};

export default function UATTesterPortalPage() {
  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Sample dashboard</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Welcome, <span className="text-[#789265]">Tester</span></h1>
          <p className="mt-2 text-slate-500">Explore the complete frontend journey for assignments, bug reports, rewards and tester support.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <CalendarDays className="h-5 w-5 text-[#2878d0]" /><div><p className="text-xs text-slate-400">Example payout schedule</p><p className="text-sm font-semibold">Twice monthly</p></div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#2878d0]/20 bg-gradient-to-r from-[#edf5ff] to-[#eef4e9] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2878d0]/10">
            <Gauge className="h-5 w-5 text-[#2878d0]" />
          </div>
          <div>
            <p className="font-semibold text-[#17325c]">Already an approved tester?</p>
            <p className="text-sm text-slate-500">Jump to your live dashboard with real jobs, assignments and earnings.</p>
          </div>
        </div>
        <Link href="/uat/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#1e68b9] whitespace-nowrap cursor-pointer shrink-0">
          Go to Live Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map(({ icon: Icon, value, label, note }, index) => (
          <article key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${index % 2 === 0 ? 'bg-sky-100 text-[#2878d0]' : 'bg-[#e8f0e1] text-[#6f8d5c]'}`}><Icon className="h-6 w-6" /></div>
            <div><p className="text-2xl font-bold">{value}</p><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-serif text-2xl font-semibold">Available Assignments</h2><Link href="/uat-testing/portal/assignments" className="text-sm font-semibold text-[#2878d0]">View all</Link></div>
            <div className="divide-y divide-slate-100">
              {demoAssignments.slice(0, 3).map(({ id, title, project, device, duration, reward, icon: Icon }) => (
                <div key={id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(240px,1.5fr)_0.8fr_0.6fr_0.5fr_auto] md:items-center">
                  <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100"><Icon className="h-5 w-5 text-[#17325c]" /></div><div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{project}</p></div></div>
                  <p className="text-sm text-slate-500">{device}</p><p className="flex items-center gap-1 text-sm text-slate-500"><Clock3 className="h-4 w-4" />{duration}</p><span className="w-fit rounded-lg bg-[#edf4e8] px-3 py-1 text-sm font-bold text-[#617a50]">{reward}</span><Link href="/uat-testing/portal/assignments" className="rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-600">Preview</Link>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-serif text-2xl font-semibold">Recent Bug Reports</h2><Link href="/uat-testing/portal/reports" className="text-sm font-semibold text-[#2878d0]">View all</Link></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Bug ID</th><th className="px-5 py-3">Title</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Reward</th></tr></thead><tbody className="divide-y divide-slate-100">{demoReports.slice(0, 3).map((report) => <tr key={report.id}><td className="px-5 py-4 font-semibold text-[#2878d0]">{report.id}</td><td className="px-5 py-4 font-medium">{report.title}</td><td className="px-5 py-4 text-slate-500">{report.submitted}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[report.status]}`}>{report.status}</span></td><td className="px-5 py-4 font-semibold">{report.reward}</td></tr>)}</tbody></table></div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Tester Score</h2><Gauge className="h-5 w-5 text-[#2878d0]" /></div><div className="mx-auto mt-5 flex h-36 w-36 flex-col items-center justify-center rounded-full border-[10px] border-[#86a66f] bg-white"><span className="text-4xl font-bold">92</span><span className="text-xs text-slate-500">Sample score</span></div><div className="mt-6 space-y-3">{['High-quality reports', 'Timely submissions', 'Helpful feedback'].map((item) => <p key={item} className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[#789265]" />{item}</p>)}</div></section>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Payments</h2><WalletCards className="h-5 w-5 text-[#789265]" /></div><p className="mt-5 text-3xl font-bold">£68.50</p><p className="text-sm text-slate-500">Example available balance</p><p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">No live payment account or balance is connected.</p><Link href="/uat-testing/portal/payments" className="mt-4 block rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold">View sample statement</Link></section>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-serif text-2xl font-semibold">Quick Actions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        [Play, 'Browse Tests', 'See suitable sample assignments', '/uat-testing/portal/assignments'],
        [Send, 'Submit Bug', 'Open the demo reporting form', '/uat-testing/portal/reports'],
        [WalletCards, 'View Payments', 'Check the sample statement', '/uat-testing/portal/payments'],
        [MessageCircle, 'Messages', 'Read project communications', '/uat-testing/portal/messages'],
      ].map(([Icon, title, copy, href]) => { const ActionIcon = Icon as typeof Play; return <Link href={href as string} key={title as string} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left text-slate-500 transition hover:border-[#2878d0] hover:bg-sky-50"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100"><ActionIcon className="h-5 w-5 text-[#2878d0]" /></div><span><span className="block font-semibold text-[#17325c]">{title as string}</span><span className="mt-1 block text-xs text-slate-500">{copy as string}</span></span></Link>; })}</div></section>
    </>
  );
}
