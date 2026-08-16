'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import CommandShell from '@/components/admin/CommandShell';
import {
  FolderKanban, Heart, Activity, DollarSign, LifeBuoy, Bell,
  ListTodo, Rocket, TrendingUp, TrendingDown, ArrowUpRight,
  Users, Zap, AlertTriangle, CheckCircle2, Clock, ExternalLink
} from 'lucide-react';

interface DFProject {
  id: string;
  name: string;
  slug: string;
  status: string;
  health_score: number;
  uptime: number;
  user_count: number;
  revenue: number;
  monthly_running_cost: number;
  deployment_status: string;
  backup_status: string;
  last_heartbeat: string;
  live_url: string;
}

export default function CommandCentrePage() {
  const [projects, setProjects] = useState<DFProject[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projRes, alertsRes, tasksRes, supportRes] = await Promise.all([
        supabase.from('digital_footprint_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('digital_footprint_alerts').select('*').eq('is_resolved', false).order('created_at', { ascending: false }),
        supabase.from('digital_footprint_tasks').select('*').in('status', ['backlog', 'in_progress', 'blocked']).order('created_at', { ascending: false }),
        supabase.from('digital_footprint_support').select('*').in('status', ['open', 'in_progress']).order('created_at', { ascending: false }),
      ]);

      if (projRes.data) setProjects(projRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch (e) {
      // Dashboard data load failure — handled gracefully
    }
    setLoading(false);
  };

  const liveProjects = projects.filter(p => p.status === 'live');
  const devProjects = projects.filter(p => ['planning', 'development', 'testing', 'uat'].includes(p.status));
  const totalUsers = projects.reduce((s, p) => s + (p.user_count || 0), 0);
  const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalCosts = projects.reduce((s, p) => s + (p.monthly_running_cost || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const criticalAlerts = alerts.filter(a => a.alert_type === 'critical').length;
  const openTasks = tasks.length;

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: '#06B6D4', bg: 'bg-[#06B6D4]/8' },
    { label: 'Live Projects', value: liveProjects.length, icon: Zap, color: '#10B981', bg: 'bg-[#10B981]/8' },
    { label: 'In Development', value: devProjects.length, icon: Activity, color: '#F59E0B', bg: 'bg-[#F59E0B]/8' },
    { label: 'Total Users', value: totalUsers, icon: Users, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/8' },
    { label: 'Total Revenue', value: '£' + totalRevenue.toLocaleString(), icon: DollarSign, color: '#10B981', bg: 'bg-[#10B981]/8' },
    { label: 'Monthly Costs', value: '£' + totalCosts.toLocaleString(), icon: TrendingDown, color: '#F97316', bg: 'bg-[#F97316]/8' },
    { label: 'Net Profit', value: '£' + totalProfit.toLocaleString(), icon: TrendingUp, color: '#06B6D4', bg: 'bg-[#06B6D4]/8' },
    { label: 'Open Tasks', value: openTasks, icon: ListTodo, color: '#EC4899', bg: 'bg-[#EC4899]/8' },
    { label: 'Active Alerts', value: alerts.length, icon: Bell, color: '#EF4444', bg: 'bg-[#EF4444]/8' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#10B981';
      case 'development': return '#F59E0B';
      case 'testing': case 'uat': return '#3B82F6';
      case 'maintenance': return '#8B5CF6';
      case 'paused': return '#9CA3AF';
      case 'archived': return '#6B7280';
      case 'idea': case 'planning': return '#6366F1';
      default: return '#64748B';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <CommandShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </CommandShell>
    );
  }

  return (
    <CommandShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Command Centre</h1>
          <p className="text-sm text-slate-400">Operational headquarters for all Digital-Footprint systems</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {stats.slice(0, 5).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.slice(5).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Project Cards</h2>
              <Link href="/admin/command-centre/projects" className="text-xs text-[#06B6D4] hover:underline cursor-pointer flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No projects yet. Create your first project.</p>
              ) : (
                projects.slice(0, 6).map((project) => (
                  <Link key={project.id} href={`/admin/command-centre/projects`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer group">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(project.status) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-[#06B6D4] transition-colors">{project.name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{project.status.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold" style={{ color: getHealthColor(project.health_score || 0) }}>{project.health_score || '--'}</div>
                        <div className="text-[10px] text-slate-500">Health</div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Active Alerts</h2>
              <Link href="/admin/command-centre/alerts" className="text-xs text-[#06B6D4] hover:underline cursor-pointer flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No active alerts</p>
                  <p className="text-xs text-slate-600 mt-0.5">All systems operational</p>
                </div>
              ) : (
                alerts.slice(0, 8).map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                    alert.alert_type === 'critical' ? 'bg-red-500/5 border-red-500/10' :
                    alert.alert_type === 'warning' ? 'bg-amber-500/5 border-amber-500/10' :
                    'bg-blue-500/5 border-blue-500/10'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      alert.alert_type === 'critical' ? 'text-red-400' :
                      alert.alert_type === 'warning' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{alert.description || 'No description'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      alert.alert_type === 'critical' ? 'bg-red-500/10 text-red-400' :
                      alert.alert_type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>{alert.alert_type}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link href="/admin/command-centre/tasks" className="glass-card rounded-2xl p-5 hover:border-[#06B6D4]/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Open Tasks</h2>
              <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-[#06B6D4] transition-colors" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{openTasks}</div>
            <p className="text-xs text-slate-400">
              {tasks.filter((t: any) => t.priority === 'critical').length} critical · {tasks.filter((t: any) => t.status === 'blocked').length} blocked
            </p>
          </Link>

          <Link href="/admin/command-centre/support" className="glass-card rounded-2xl p-5 hover:border-[#06B6D4]/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Support Tickets</h2>
              <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-[#06B6D4] transition-colors" />
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-white">{alerts.filter((a: any) => a.source === 'other').length || 0}</div>
              <span className="text-xs text-slate-400 mb-0.5">awaiting data</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Support module active</p>
          </Link>

          <Link href="/admin/command-centre/readiness" className="glass-card rounded-2xl p-5 hover:border-[#06B6D4]/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Production Readiness</h2>
              <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-[#06B6D4] transition-colors" />
            </div>
            <div className="text-3xl font-bold text-[#F59E0B] mb-1">--</div>
            <p className="text-xs text-slate-400">Insufficient data</p>
          </Link>
        </div>

        {projects.length === 0 && (
          <div className="mt-8 glass-card rounded-2xl p-10 text-center">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Welcome to the Command Centre</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              No projects have been added yet. Start by creating your first Digital-Footprint project to populate the dashboard.
            </p>
            <Link
              href="/admin/command-centre/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer"
            >
              Create First Project
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </CommandShell>
  );
}