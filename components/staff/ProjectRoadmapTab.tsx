'use client';

import { Map, AlertCircle } from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  target_date: string | null;
}

const priorityColors: Record<string, string> = { urgent: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF' };
const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };

export default function ProjectRoadmapTab({
  items,
  loading,
  error,
  onRetry,
}: {
  items: RoadmapItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': case 'done': return 'bg-[#10B981]/10 text-[#10B981]';
      case 'in_progress': case 'active': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'blocked': return 'bg-[#EF4444]/10 text-[#EF4444]';
      default: return 'bg-white/5 text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1"><div className="h-4 bg-white/5 rounded w-2/3 mb-1" /><div className="h-3 bg-white/5 rounded w-1/3" /></div>
              <div className="w-20 h-6 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load roadmap</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <div className="text-center py-16">
          <Map className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-medium mb-1">No roadmap items</p>
          <p className="text-sm text-slate-500">Technology roadmap items will appear here.</p>
        </div>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => {
    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (pOrder[a.priority] ?? 5) - (pOrder[b.priority] ?? 5);
  });

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {sorted.map(item => (
          <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                <Map className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{item.title}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {item.category || 'General'}
                  {item.target_date ? ` · ${new Date(item.target_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                </p>
                {item.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border"
                style={{ backgroundColor: (priorityColors[item.priority] || '#9CA3AF') + '15', color: priorityColors[item.priority] || '#9CA3AF', borderColor: (priorityColors[item.priority] || '#9CA3AF') + '30' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityColors[item.priority] || '#9CA3AF' }} />
                {priorityLabels[item.priority] || item.priority}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium capitalize ${getStatusStyle(item.status)}`}>
                {item.status?.replace(/_/g, ' ') || 'pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}