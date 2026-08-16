'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Save, Plus, Trash2, GitBranch, ChevronDown, Check,
  X, AlertTriangle, Search, Filter, Layers, GripVertical,
  MoveUp, MoveDown, Eye,
} from 'lucide-react';

interface PersonalisationField {
  id: string;
  display_name: string;
  stable_key: string;
  data_type: string;
  status: string;
  sensitivity: string;
  fallback_policy: string;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  group: number;
  logic: 'AND' | 'OR';
}

interface RuleVariant {
  id: string;
  label: string;
  content: string;
  priority: number;
}

interface RuleFormState {
  id: string | null;
  name: string;
  description: string;
  sourceType: string;
  targetType: string;
  priority: number;
  conflictStrategy: string;
  status: string;
  conditions: RuleCondition[];
  variants: RuleVariant[];
  defaultContent: string;
  fallbackContent: string;
}

const OPERATORS: Record<string, { label: string; types: string[] }> = {
  equals: { label: 'Equals', types: ['text', 'number', 'boolean', 'enum', 'locale'] },
  not_equals: { label: 'Does not equal', types: ['text', 'number', 'boolean', 'enum', 'locale'] },
  exists: { label: 'Exists (has value)', types: ['text', 'number', 'boolean', 'datetime', 'currency', 'enum', 'url', 'locale', 'list', 'product_ref'] },
  not_exists: { label: 'Does not exist (empty)', types: ['text', 'number', 'boolean', 'datetime', 'currency', 'enum', 'url', 'locale', 'list', 'product_ref'] },
  is_one_of: { label: 'Is one of', types: ['text', 'enum'] },
  contains: { label: 'Contains', types: ['text', 'list'] },
  greater_than: { label: 'Greater than', types: ['number', 'currency'] },
  less_than: { label: 'Less than', types: ['number', 'currency'] },
  before_date: { label: 'Before date', types: ['datetime'] },
  after_date: { label: 'After date', types: ['datetime'] },
  is_true: { label: 'Is true', types: ['boolean'] },
  is_false: { label: 'Is false', types: ['boolean'] },
};

export default function PersonalisationRules() {
  const router = useRouter();
  const [form, setForm] = useState<RuleFormState>({
    id: null, name: '', description: '', sourceType: 'template', targetType: 'text',
    priority: 0, conflictStrategy: 'first_match', status: 'draft',
    conditions: [], variants: [], defaultContent: '', fallbackContent: '',
  });
  const [fields, setFields] = useState<PersonalisationField[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('email_personalisation_fields').select('*').eq('status', 'approved').order('display_name');
      if (data) setFields(data as PersonalisationField[]);
    };
    load();
  }, []);

  const getOperatorsForField = (stableKey: string): { key: string; label: string }[] => {
    const field = fields.find(f => f.stable_key === stableKey);
    if (!field) return [];
    return Object.entries(OPERATORS)
      .filter(([, v]) => v.types.includes(field.data_type))
      .map(([k, v]) => ({ key: k, label: v.label }));
  };

  const getFieldType = (stableKey: string): string => {
    const field = fields.find(f => f.stable_key === stableKey);
    return field?.data_type || 'text';
  };

  const addCondition = () => {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { id: crypto.randomUUID(), field: '', operator: 'equals', value: '', group: 0, logic: 'AND' }],
    }));
  };

  const updateCondition = (id: string, patch: Partial<RuleCondition>) => {
    setForm(prev => ({ ...prev, conditions: prev.conditions.map(c => c.id === id ? { ...c, ...patch } : c) }));
  };

  const removeCondition = (id: string) => {
    setForm(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== id) }));
  };

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), label: `Variant ${prev.variants.length + 1}`, content: '', priority: prev.variants.length }],
    }));
  };

  const updateVariant = (id: string, patch: Partial<RuleVariant>) => {
    setForm(prev => ({ ...prev, variants: prev.variants.map(v => v.id === id ? { ...v, ...patch } : v) }));
  };

  const removeVariant = (id: string) => {
    setForm(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
  };

  const moveVariant = (id: string, direction: 'up' | 'down') => {
    setForm(prev => {
      const idx = prev.variants.findIndex(v => v.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.variants.length) return prev;
      const next = [...prev.variants];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...prev, variants: next.map((v, i) => ({ ...v, priority: i })) };
    });
  };

  const buildPlainEnglish = (): string => {
    if (form.conditions.length === 0 && !form.defaultContent) return 'No conditions — default content always shown';
    const parts: string[] = [];
    const groups = new Map<number, RuleCondition[]>();
    form.conditions.forEach(c => {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group)!.push(c);
    });

    groups.forEach((conds, gIdx) => {
      const inner: string[] = [];
      conds.forEach(c => {
        const fieldName = fields.find(f => f.stable_key === c.field)?.display_name || c.field;
        const opLabel = OPERATORS[c.operator]?.label || c.operator;
        if (c.operator === 'exists') inner.push(`${fieldName} has a value`);
        else if (c.operator === 'not_exists') inner.push(`${fieldName} is empty`);
        else if (c.operator === 'is_true') inner.push(`${fieldName} is true`);
        else if (c.operator === 'is_false') inner.push(`${fieldName} is false`);
        else inner.push(`${fieldName} ${opLabel.toLowerCase()} "${c.value}"`);
      });
      if (inner.length > 0) {
        parts.push(`IF ${inner.join(` ${conds[0]?.logic || 'AND'} `)}`);
      }
    });

    const variantSummaries = form.variants.map(v => `  → Show "${v.label}" version`);
    return parts.join('\n') + '\nTHEN\n' + (variantSummaries.length > 0 ? variantSummaries.join('\n') : '  → Show default content') + (form.fallbackContent ? '\nOTHERWISE\n  → Show fallback content' : '');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Rule name is required'); return; }
    if (form.conditions.length === 0 && form.variants.length === 0) { setError('Add at least one condition or variant'); return; }

    setSaving(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userId || '').maybeSingle();

    const payload = {
      name: form.name.trim(),
      description: form.description,
      source_type: form.sourceType,
      target_type: form.targetType,
      priority: form.priority,
      conflict_strategy: form.conflictStrategy,
      status: form.status,
      rule_logic: { conditions: form.conditions, groups: [...new Set(form.conditions.map(c => c.group))].length },
      variants: form.variants,
      default_variant: form.defaultContent ? { label: 'Default', content: form.defaultContent, priority: -1 } : null,
      fallback_variant: form.fallbackContent ? { label: 'Fallback', content: form.fallbackContent, priority: -2 } : null,
      organisation_id: profileData?.organisation_id || null,
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (form.id) {
      const { error: updateError } = await supabase.from('email_dynamic_rules').update(payload).eq('id', form.id);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
    } else {
      const { data: insertData, error: insertError } = await supabase.from('email_dynamic_rules').insert(payload).select('id').single();
      if (insertError) { setError(insertError.message); setSaving(false); return; }
      if (insertData) setForm(prev => ({ ...prev, id: insertData.id }));
    }

    setSaving(false);
    setStatusMsg('Rule saved successfully');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/personalisation" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Personalisation
        </Link>
        <span className="text-slate-600">/</span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Rule Builder</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {statusMsg && <span className="text-[11px] text-emerald-400">{statusMsg}</span>}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Rule Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Rule Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Project-specific greeting"
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source Type</label>
                <select value={form.sourceType} onChange={(e) => setForm(prev => ({ ...prev, sourceType: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                  <option value="template">Template</option>
                  <option value="campaign">Campaign</option>
                  <option value="automation">Automation</option>
                  <option value="transactional">Transactional</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Type</label>
                <select value={form.targetType} onChange={(e) => setForm(prev => ({ ...prev, targetType: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                  <option value="subject">Subject Line</option>
                  <option value="preview_text">Preview Text</option>
                  <option value="heading">Heading</option>
                  <option value="text">Text Block</option>
                  <option value="button">Button</option>
                  <option value="image">Image</option>
                  <option value="section">Section</option>
                  <option value="repeatable">Repeatable Content</option>
                  <option value="link">Link</option>
                  <option value="locale">Locale Content</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                  <option value="draft">Draft</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does..."
                rows={2} maxLength={300}
                className="w-full px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority (higher = first)</label>
                <input type="number" value={form.priority} onChange={(e) => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Conflict Strategy</label>
                <select value={form.conflictStrategy} onChange={(e) => setForm(prev => ({ ...prev, conflictStrategy: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                  <option value="first_match">First Match Wins</option>
                  <option value="highest_priority">Highest Priority</option>
                  <option value="mutual_exclusive">Mutually Exclusive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Conditions</h2>
              <button onClick={addCondition}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Condition
              </button>
            </div>

            {form.conditions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No conditions yet. Add conditions to create rule logic.</p>
            ) : (
              <div className="space-y-3">
                {form.conditions.map((cond, idx) => (
                  <div key={cond.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[10px] text-slate-500 font-mono">Condition {idx + 1}</span>
                      </div>
                      <button onClick={() => removeCondition(cond.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-1">Field</label>
                        <select value={cond.field} onChange={(e) => { updateCondition(cond.id, { field: e.target.value, operator: '', value: '' }); }}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                          <option value="">Select field...</option>
                          {fields.filter(f => f.status === 'approved' && f.sensitivity !== 'restricted').map(f => (
                            <option key={f.stable_key} value={f.stable_key}>{f.display_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-1">Operator</label>
                        <select value={cond.operator} onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                          {getOperatorsForField(cond.field).map(op => (
                            <option key={op.key} value={op.key}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-1">Value</label>
                        {['exists', 'not_exists', 'is_true', 'is_false'].includes(cond.operator) ? (
                          <input disabled value="—" className="w-full px-3 py-2 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-lg text-sm text-slate-600" />
                        ) : getFieldType(cond.field) === 'boolean' ? (
                          <select value={cond.value} onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white cursor-pointer pr-8 appearance-none">
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : getFieldType(cond.field) === 'datetime' ? (
                          <input type="date" value={cond.value} onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                          />
                        ) : (
                          <input type="text" value={cond.value} onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                            placeholder="Value..."
                            className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                          />
                        )}
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-1">Logic</label>
                        <select value={cond.logic} onChange={(e) => updateCondition(cond.id, { logic: e.target.value as 'AND' | 'OR' })}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white cursor-pointer pr-8 appearance-none">
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    </div>
                    {idx < form.conditions.length - 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-px flex-1 bg-[rgba(255,255,255,0.04)]" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2">{cond.logic}</span>
                        <div className="h-px flex-1 bg-[rgba(255,255,255,0.04)]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Variants</h2>
              <button onClick={addVariant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Default Content (no conditions match)</label>
                <textarea value={form.defaultContent} onChange={(e) => setForm(prev => ({ ...prev, defaultContent: e.target.value }))}
                  placeholder="Default content shown when no conditions match..."
                  rows={2} maxLength={500}
                  className="w-full px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                />
              </div>

              {form.variants.map((v, idx) => (
                <div key={v.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">Variant {idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveVariant(v.id, 'up')} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.04] text-slate-500 hover:text-white cursor-pointer"><MoveUp className="w-3 h-3" /></button>
                      <button onClick={() => moveVariant(v.id, 'down')} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.04] text-slate-500 hover:text-white cursor-pointer"><MoveDown className="w-3 h-3" /></button>
                      <button onClick={() => removeVariant(v.id)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Label</label>
                      <input type="text" value={v.label} onChange={(e) => updateVariant(v.id, { label: e.target.value })}
                        className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Priority</label>
                      <input type="number" value={v.priority} onChange={(e) => updateVariant(v.id, { priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Content</label>
                    <textarea value={v.content} onChange={(e) => updateVariant(v.id, { content: e.target.value })}
                      placeholder="Variant content..." rows={2} maxLength={500}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fallback Content (all variants fail)</label>
              <textarea value={form.fallbackContent} onChange={(e) => setForm(prev => ({ ...prev, fallbackContent: e.target.value }))}
                placeholder="Last resort content if nothing else applies..."
                rows={2} maxLength={300}
                className="w-full px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Plain-English Summary</h3>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">{buildPlainEnglish()}</pre>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Quick Reference</h3>
            <div className="text-xs text-slate-400 space-y-2">
              <p><strong className="text-slate-300">Source:</strong> {form.sourceType || 'template'}</p>
              <p><strong className="text-slate-300">Target:</strong> {form.targetType.replace(/_/g, ' ') || 'text'}</p>
              <p><strong className="text-slate-300">Conditions:</strong> {form.conditions.length}</p>
              <p><strong className="text-slate-300">Variants:</strong> {form.variants.length + (form.defaultContent ? 1 : 0)}</p>
              <p><strong className="text-slate-300">Strategy:</strong> {form.conflictStrategy.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-400/70 space-y-1">
                <p className="font-medium text-amber-300">Safety Rules</p>
                <p>Rules must use approved fields only. Restricted and high-sensitivity fields are excluded from the field selector.</p>
                <p className="mt-1">Legal, consent, unsubscribe and suppression content must never be varied through dynamic rules.</p>
              </div>
            </div>
          </div>

          <Link href="/admin/email/personalisation/test-data" className="flex items-center gap-2 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer w-full">
            <Eye className="w-4 h-4 text-slate-500" />
            Preview with Test Data
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 ml-auto rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}