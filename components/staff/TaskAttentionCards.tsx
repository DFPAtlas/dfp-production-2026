'use client';

import { motion } from '@/components/motion';
import { Clock, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

interface CardData {
  label: string;
  value: number;
  caption: string;
  icon: React.ElementType;
  color: string;
  selected: boolean;
  loading?: boolean;
  filterKey: string;
}

export default function TaskAttentionCards({
  dueToday,
  overdue,
  inProgress,
  completedThisWeek,
  loading,
  selectedCard,
  onSelect,
}: {
  dueToday: number;
  overdue: number;
  inProgress: number;
  completedThisWeek: number;
  loading: boolean;
  selectedCard: string | null;
  onSelect: (key: string | null) => void;
}) {
  const cards: CardData[] = [
    {
      label: 'Due Today',
      value: dueToday,
      caption: dueToday === 0 ? 'All caught up' : `${dueToday} task${dueToday !== 1 ? 's' : ''} due within 24 hours`,
      icon: Clock,
      color: '#06B6D4',
      selected: selectedCard === 'due_today',
      filterKey: 'due_today',
    },
    {
      label: 'Overdue',
      value: overdue,
      caption: overdue === 0 ? 'Nothing past due' : `${overdue} task${overdue !== 1 ? 's' : ''} past due date`,
      icon: AlertTriangle,
      color: overdue > 0 ? '#EF4444' : '#9CA3AF',
      selected: selectedCard === 'overdue',
      filterKey: 'overdue',
    },
    {
      label: 'In Progress',
      value: inProgress,
      caption: `${inProgress} task${inProgress !== 1 ? 's' : ''} being worked on`,
      icon: Loader2,
      color: '#F59E0B',
      selected: selectedCard === 'in_progress',
      filterKey: 'in_progress',
    },
    {
      label: 'Completed This Week',
      value: completedThisWeek,
      caption: completedThisWeek === 0 ? 'None this week' : `${completedThisWeek} done this week`,
      icon: CheckCircle,
      color: '#10B981',
      selected: selectedCard === 'completed_week',
      filterKey: 'completed_week',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.button
          key={card.filterKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(card.selected ? null : card.filterKey)}
          className={`text-left bg-[#1E293B] border rounded-2xl p-5 transition-all cursor-pointer group ${
            card.selected
              ? 'border-[#06B6D4]/50 ring-1 ring-[#06B6D4]/20'
              : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-12 bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white tracking-tight">{card.value}</p>
          )}
          <p className="text-xs text-slate-500 mt-1.5">{card.caption}</p>
        </motion.button>
      ))}
    </div>
  );
}