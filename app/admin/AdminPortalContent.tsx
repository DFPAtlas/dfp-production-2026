'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import AdminShell from '../../components/admin/AdminShell';
import DashboardHeader from '../../components/admin/dashboard/DashboardHeader';
import AttentionStrip from '../../components/admin/dashboard/AttentionStrip';
import KpiCards from '../../components/admin/dashboard/KpiCards';
import RevenueTrendChart from '../../components/admin/dashboard/RevenueTrendChart';
import FinanceSummary from '../../components/admin/dashboard/FinanceSummary';
import ProjectPortfolio from '../../components/admin/dashboard/ProjectPortfolio';
import ProjectStatusPie from '../../components/admin/dashboard/ProjectStatusPie';
import LeadsSummary from '../../components/admin/dashboard/LeadsSummary';
import RecentActivity from '../../components/admin/dashboard/RecentActivity';
import OperationalHealth from '../../components/admin/dashboard/OperationalHealth';
import TaskOverviewCard from '../../components/admin/dashboard/TaskOverviewCard';
import ClientSummaryCard from '../../components/admin/dashboard/ClientSummaryCard';
import Link from 'next/link';
import { LoadingState, ErrorState, ConnectionFailedState } from '../../components/admin/shared/DataState';
import { AlertTriangle } from 'lucide-react';

export function AdminPortalContent() {
  const { data, dateRange, setDateRange, refresh } = useDashboardData('30days');

  if (data.loading && !data.lastRefreshed) {
    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto">
          <DashboardHeader
            dateRangeLabel={dateRange.label}
            lastRefreshed={null}
            partialFailures={[]}
            onRefresh={refresh}
            onDateRangeChange={setDateRange}
            loading={true}
          />
          <LoadingState />
        </div>
      </AdminShell>
    );
  }

  if (data.error && !data.lastRefreshed) {
    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto">
          <DashboardHeader
            dateRangeLabel={dateRange.label}
            lastRefreshed={null}
            partialFailures={[]}
            onRefresh={refresh}
            onDateRangeChange={setDateRange}
            loading={false}
          />
          {data.error.includes('fetch') || data.error.includes('network') || data.error.includes('Failed to fetch') ? (
            <ConnectionFailedState onRetry={refresh} />
          ) : (
            <ErrorState onRetry={refresh}>{data.error}</ErrorState>
          )}
        </div>
      </AdminShell>
    );
  }

  const isLoading = data.loading && !!data.lastRefreshed;

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          dateRangeLabel={dateRange.label}
          lastRefreshed={data.lastRefreshed}
          partialFailures={data.partialFailures}
          onRefresh={refresh}
          onDateRangeChange={setDateRange}
          loading={data.loading}
        />

        <AttentionStrip items={data.attentionItems} />

        <KpiCards kpis={data.kpis} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RevenueTrendChart data={data.revenueTrend} loading={isLoading} />
          </div>
          <ProjectStatusPie
            active={data.projects.active}
            atRisk={data.projects.atRisk}
            completed={data.projects.completed}
            total={data.projects.total}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FinanceSummary data={data.finance} loading={isLoading} />
          <ProjectPortfolio data={data.projects} loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LeadsSummary data={data.leads} loading={isLoading} />
          <ClientSummaryCard data={data.clients} loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TaskOverviewCard data={data.tasks} loading={isLoading} />
          <div className="space-y-6">
            <RecentActivity items={data.recentActivity} loading={isLoading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <OperationalHealth items={data.healthItems} loading={isLoading} />

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-5">UAT Testing</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#0F172A] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[#06B6D4]">{data.uat.jobsInProgress}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Jobs Active</div>
              </div>
              <div className="bg-[#0F172A] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[#8B5CF6]">{data.uat.testersAssigned}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Testers Active</div>
              </div>
              <div className="bg-[#0F172A] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[#F59E0B]">{data.uat.feedbackAwaiting}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Feedback Pending</div>
              </div>
              <div className="bg-[#0F172A] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[#EF4444]">{data.uat.criticalDefects}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Critical Defects</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Link href="/admin/uat/jobs" className="text-xs text-[#06B6D4] hover:underline cursor-pointer">UAT Jobs</Link>
              <Link href="/admin/uat/feedback" className="text-xs text-[#06B6D4] hover:underline cursor-pointer">UAT Feedback</Link>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}