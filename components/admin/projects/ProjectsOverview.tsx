'use client';

import { motion } from '@/components/motion';
import { useProjectsOverview } from '@/hooks/useProjectData';
import { FolderKanban, Activity, AlertTriangle, Clock, Rocket, CheckCircle, Target, Shield } from 'lucide-react';

const METRIC_ICONS: Record<string, React.ElementType> = {
  total: FolderKanban,
  active: Activity,
  atRisk: AlertTriangle,
  planning: Clock,
  ready: Rocket,
  awaitingUat: Shield,
  complete: CheckCircle,
  healthy: Target,
};

const METRIC_COLORS: Record<string, string> = {
  total: '#06B6D4',
  active: '#10B981',
  atRisk: '#EF4444',
  planning: '#F59E0B',
  ready: '#3B82F6',
  awaitingUat: '#8B5CF6',
  complete: '#6366F1',
  healthy: '#10B981',
};

const METRICS = [
  { key: 'total', label: 'Total Projects' },
  { key: 'active', label: 'Active' },
  { key: 'atRisk', label: 'At Risk' },
  { key: 'planning', label: 'Planning' },
  { key: 'ready', label: 'Ready / Launch' },
  { key: 'awaitingUat', label: 'Awaiting UAT' },
  { key: 'complete', label: 'Complete' },
  { key: 'healthy', label: 'Healthy' },
];

export default function ProjectsOverview() {
  const { stats, loading } = useProjectsOverview();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {METRICS.map((metric, index) => {
        const Icon = METRIC_ICONS[metric.key] || FolderKanban;
        const color = METRIC_COLORS[metric.key] || '#94A3B8';
        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-white mb-0.5">
              {loading ? <span className="inline-block w-8 h-5 bg-white/5 rounded animate-pulse" /> : stats[metric.key] ?? 0}
            </p>
            <p className="text-xs text-slate-400">{metric.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}