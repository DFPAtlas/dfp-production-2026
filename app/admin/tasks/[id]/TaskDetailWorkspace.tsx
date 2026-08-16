'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { useTasksData } from '@/hooks/useTasksData';
import { motion } from '@/components/motion';
import {
  getStatusDef, getPriorityDef, getTypeDef, getReviewDef,
  TASK_STATUSES, TASK_PRIORITIES,
} from '@/lib/task-definitions';
import {
  ArrowLeft, CheckCircle, Clock, Calendar, User, AlertTriangle,
  GitBranch, MessageSquare, ListTodo, Eye, FileText, History,
  Settings, Plus, X, Loader2, Paperclip, Link2, Trash2, Edit2,
} from 'lucide-react';

const TABS = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'checklist', label: 'Checklist', icon: ListTodo },
  { id: 'dependencies', label: 'Dependencies', icon: GitBranch },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TaskDetailWorkspace({ taskId }: { taskId: string }) {
  const router = useRouter();
  const {
    task, checklistItems, dependencies, comments, timeEntries,
    loading, error, refresh, updateTask, insertRecord, updateRecord, deleteRecord,
  } = useTasksData(taskId);

  const [activeTab, setActiveTab] = useState('details');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reasonModal, setReasonModal] = useState<string | null>(null);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (error || !task) {
    return (
      <AdminShell>
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error || 'Task not found'}</p>
          <Link href="/admin/tasks" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Back to Tasks</Link>
        </div>
      </AdminShell>
    );
  }

  const statusDef = getStatusDef(task.status as string);
  const priorityDef = getPriorityDef(task.priority as string);
  const typeDef = getTypeDef(task.task_type as string);
  const reviewDef = getReviewDef(task.review_status as string);

  const isOverdue = task.due_date && task.status !== 'complete' && task.status !== 'cancelled' && new Date(task.due_date as string) < new Date();

  const handleAddRecord = async (table: string) => {
    if (table === 'task_checklist_items' && !formData.label) return;
    if (table === 'task_dependencies' && !formData.depends_on_id) return;
    if (table === 'task_comments' && !formData.content) return;
    if (table === 'task_time_entries' && !formData.duration_minutes) return;
    setSaving(true);
    const record: Record<string, unknown> = { ...formData };
    if (table === 'task_comments') record.is_internal = true;
    if (table === 'task_time_entries') record.duration_minutes = parseInt(formData.duration_minutes) || 0;
    await insertRecord(table, record);
    setSaving(false);
    setShowModal(null);
    setFormData({});
  };

  const handleStatusChange = async (newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'complete') updates.completed_at = new Date().toISOString();
    if (newStatus === 'cancelled') { updates.cancelled_at = new Date().toISOString(); updates.cancelled_reason = reasonModal || 'Changed via task detail'; }
    if (newStatus === 'archived') updates.archived_at = new Date().toISOString();
    await updateTask(taskId, updates);
    setReasonModal(null);
  };

  const renderHeader = () => (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/tasks" className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">Tasks</Link>
            <span className="text-slate-600">/</span>
            <h1 className="text-2xl font-bold text-white">{task.title as string}</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-slate-500">{(task.task_reference as string) || (taskId ? taskId.slice(0, 8) : 'No ref')}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDef.color }} />
              {statusDef.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: `${priorityDef.color}15`, color: priorityDef.color }}>
              {priorityDef.label}
            </span>
            <span className="text-xs text-slate-500">{(task.task_type as string)?.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div className="relative group">
          <button className="px-4 py-2 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
            Change Status
          </button>
          <div className="absolute right-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 min-w-[160px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {TASK_STATUSES.filter(s => s.value !== 'archived').map(s => (
              <button key={s.value} onClick={() => ['complete', 'cancelled', 'archived'].includes(s.value) ? setReasonModal(s.value) : handleStatusChange(s.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)]">
        {[
          { label: 'Due', value: task.due_date ? new Date(task.due_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—', warn: isOverdue },
          { label: 'Est. Effort', value: task.estimated_effort_hours != null ? `${task.estimated_effort_hours}h` : '—' },
          { label: 'Progress', value: `${task.progress || 0}%` },
          { label: 'Review', value: reviewDef.label },
          { label: 'Created', value: task.created_at ? new Date(task.created_at as string).toLocaleDateString('en-GB') : '—' },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-sm font-semibold ${m.warn ? 'text-red-400' : 'text-white'}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Description</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{(task.description as string) || 'No description provided.'}</p>
      </div>
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Task Details</h3>
        <div className="space-y-3">
          {[
            { label: 'Type', value: typeDef.label },
            { label: 'Status', value: statusDef.label },
            { label: 'Priority', value: priorityDef.label },
            { label: 'Review', value: reviewDef.label },
            { label: 'Start Date', value: task.start_date ? new Date(task.start_date as string).toLocaleDateString('en-GB') : 'Not set' },
            { label: 'Due Date', value: task.due_date ? new Date(task.due_date as string).toLocaleDateString('en-GB') : 'Not set' },
            { label: 'Estimated Effort', value: task.estimated_effort_hours != null ? `${task.estimated_effort_hours}h` : 'Not estimated' },
            { label: 'Actual Time', value: task.actual_time_minutes != null ? `${Math.round((task.actual_time_minutes as number) / 60 * 10) / 10}h` : 'Not tracked' },
            { label: 'Project', value: (task.project_id as string) ? 'Linked' : 'None' },
            { label: 'Client', value: (task.client_id as string) ? 'Linked' : 'None' },
            { label: 'Recurrence', value: (task.recurrence_rule as string) || 'None' },
          ].map(d => (
            <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <span className="text-xs text-slate-400">{d.label}</span>
              <span className="text-xs text-white font-medium">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChecklistTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Checklist ({checklistItems.filter((c: any) => c.is_completed).length}/{checklistItems.length})</h3>
        <button onClick={() => { setShowModal('task_checklist_items'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>
      {checklistItems.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <ListTodo className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No checklist items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checklistItems.map((item: any) => (
            <div key={item.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex items-center gap-3">
              <button onClick={() => updateRecord('task_checklist_items', item.id, { is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date().toISOString() : null })}
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${item.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                {item.is_completed && <CheckCircle className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm flex-1 ${item.is_completed ? 'text-slate-500 line-through' : 'text-white'}`}>{item.label}</span>
              {item.due_date && <span className="text-[10px] text-slate-500">{new Date(item.due_date as string).toLocaleDateString('en-GB')}</span>}
              <button onClick={() => deleteRecord('task_checklist_items', item.id)} className="text-slate-500 hover:text-red-400 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDependenciesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Dependencies ({dependencies.length})</h3>
        <button onClick={() => { setShowModal('task_dependencies'); setFormData({ dependency_type: 'blocks' }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Dependency
        </button>
      </div>
      {dependencies.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <GitBranch className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No dependencies</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dependencies.map((d: any) => (
            <div key={d.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-300">Depends on: <span className="text-white font-mono text-xs">{(d.depends_on_id as string)?.slice(0, 8)}</span></p>
                  <p className="text-[10px] text-slate-500 capitalize">{(d.dependency_type as string)?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <button onClick={() => deleteRecord('task_dependencies', d.id)} className="text-slate-500 hover:text-red-400 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCommentsTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Comments ({comments.length})</h3>
        <button onClick={() => { setShowModal('task_comments'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Comment
        </button>
      </div>
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c: any) => (
            <div key={c.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">{c.author_name || 'Staff'}</span>
                {c.is_internal && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Internal</span>}
              </div>
              <p className="text-sm text-slate-300">{c.content}</p>
              <p className="text-[10px] text-slate-500 mt-2">{c.created_at ? new Date(c.created_at as string).toLocaleString('en-GB') : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTimeTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Time Entries ({timeEntries.length})</h3>
        <button onClick={() => { setShowModal('task_time_entries'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Log Time
        </button>
      </div>
      {timeEntries.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No time logged</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeEntries.map((te: any) => {
            const hours = Math.floor((te.duration_minutes || 0) / 60);
            const mins = (te.duration_minutes || 0) % 60;
            return (
              <div key={te.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{hours}h {mins}m</p>
                  {te.description && <p className="text-xs text-slate-400 mt-0.5">{te.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{te.entry_date ? new Date(te.entry_date as string).toLocaleDateString('en-GB') : ''}</span>
                  {te.billable && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Billable</span>}
                  <button onClick={() => deleteRecord('task_time_entries', te.id)} className="text-slate-500 hover:text-red-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
      <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <History className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Activity tracking via notifications and audit log</p>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Task Configuration</h3>
        <div className="space-y-3">
          <div><label className="block text-xs text-slate-400 mb-1">Title</label><p className="text-sm text-white">{task.title as string}</p></div>
          <div><label className="block text-xs text-slate-400 mb-1">Reference</label><p className="text-sm font-mono text-white">{(task.task_reference as string) || 'Not set'}</p></div>
          <div><label className="block text-xs text-slate-400 mb-1">Created</label><p className="text-sm text-white">{task.created_at ? new Date(task.created_at as string).toLocaleString('en-GB') : '—'}</p></div>
          <div><label className="block text-xs text-slate-400 mb-1">Updated</label><p className="text-sm text-white">{task.updated_at ? new Date(task.updated_at as string).toLocaleString('en-GB') : '—'}</p></div>
        </div>
      </div>
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <button onClick={() => updateTask(taskId, { review_required: !task.review_required, review_status: !task.review_required ? 'awaiting_review' : 'not_required' })}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-colors cursor-pointer">
            {task.review_required ? 'Remove review requirement' : 'Require review'}
          </button>
          <button onClick={() => { if (confirm('Archive this task?')) handleStatusChange('archived'); }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer">
            Archive task
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details': return renderDetailsTab();
      case 'checklist': return renderChecklistTab();
      case 'dependencies': return renderDependenciesTab();
      case 'comments': return renderCommentsTab();
      case 'time': return renderTimeTab();
      case 'activity': return renderActivityTab();
      case 'settings': return renderSettingsTab();
      default: return renderDetailsTab();
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs: Record<string, { title: string; fields: { name: string; label: string; placeholder?: string; type?: string }[] }> = {
      task_checklist_items: { title: 'Add Checklist Item', fields: [{ name: 'label', label: 'Item', placeholder: 'e.g., Review wireframes' }, { name: 'due_date', label: 'Due Date', type: 'date' }] },
      task_dependencies: { title: 'Add Dependency', fields: [{ name: 'depends_on_id', label: 'Depends On Task ID', placeholder: 'UUID of the task' }, { name: 'dependency_type', label: 'Type', placeholder: 'blocks' }] },
      task_comments: { title: 'Add Comment', fields: [{ name: 'content', label: 'Comment', placeholder: 'Type your comment...' }] },
      task_time_entries: { title: 'Log Time', fields: [{ name: 'duration_minutes', label: 'Duration (minutes)', placeholder: 'e.g., 90' }, { name: 'description', label: 'Description', placeholder: 'What did you work on?' }, { name: 'entry_date', label: 'Date', type: 'date' }] },
    };

    const config = modalConfigs[showModal];
    if (!config) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{config.title}</h3>
            <button onClick={() => setShowModal(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            {config.fields.map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                {f.type === 'date' ? (
                  <input type="date" value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer" />
                ) : (
                  <input type="text" value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                )}
              </div>
            ))}
            <button onClick={() => handleAddRecord(showModal)} disabled={saving}
              className="w-full py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        {renderHeader()}

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">{renderTabContent()}</div>

        {renderModal()}

        {reasonModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReasonModal(null)}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Reason required</h3>
              <textarea value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                rows={3} placeholder={`Why are you setting this task to ${reasonModal?.replace(/_/g, ' ')}?`}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setReasonModal(null)} className="flex-1 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer">Cancel</button>
                <button onClick={() => { handleStatusChange(reasonModal!); setFormData({}); }}
                  className="flex-1 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}