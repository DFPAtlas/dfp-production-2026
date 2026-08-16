'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Plus, Loader2, Trash2, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateInvoiceNumber, calculateInvoiceTotals, INVOICE_STATUSES, PAYMENT_TERMS } from '@/lib/finance-definitions';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LineItem {
  key: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
}

export default function InvoiceForm({ isOpen, onClose, onSuccess }: InvoiceFormProps) {
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    client_id: '', project_id: '', description: '', currency: 'GBP',
    payment_terms: 'NET_30', purchase_order_reference: '',
    client_notes: '', internal_notes: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    tax_inclusive: false,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: '1', description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 20 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setFetchingData(true);
    const [{ data: cl }, { data: pr }] = await Promise.all([
      supabase.from('clients').select('id,company_name,contact_name,email').order('company_name'),
      supabase.from('projects').select('id,name,client_id').order('name'),
    ]);
    if (cl) setClients(cl);
    if (pr) setProjects(pr);
    setFetchingData(false);
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      key: String(Date.now()),
      description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 20,
    }]);
  };

  const removeLineItem = (key: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(l => l.key !== key));
  };

  const updateLineItem = (key: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));
  };

  const computedTotals = calculateInvoiceTotals(
    lineItems.map(l => ({ quantity: l.quantity || 0, unit_price: l.unit_price || 0, discount: l.discount || 0, tax_rate: l.tax_rate || 0 }))
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.client_id) newErrors.client_id = 'Select a client';
    if (!formData.description.trim()) newErrors.description = 'Description required';
    if (lineItems.some(l => !l.description.trim())) newErrors.lineItems = 'All line items need a description';
    if (lineItems.some(l => (l.unit_price || 0) <= 0)) newErrors.lineItems = 'All line items need a unit price > 0';
    if (computedTotals.total <= 0) newErrors.lineItems = 'Invoice total must be greater than zero';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const invoiceNumber = generateInvoiceNumber();
    const invoiceData = {
      invoice_number: invoiceNumber,
      client_id: formData.client_id || null,
      project_id: formData.project_id || null,
      description: formData.description.trim(),
      currency: formData.currency,
      subtotal: computedTotals.subtotal,
      discount: 0,
      tax: computedTotals.tax,
      total: computedTotals.total,
      tax_rate: lineItems[0]?.tax_rate || 0,
      amount_outstanding: computedTotals.total,
      amount_paid: 0,
      status: 'draft',
      payment_terms: formData.payment_terms,
      purchase_order_reference: formData.purchase_order_reference || null,
      client_notes: formData.client_notes || null,
      internal_notes: formData.internal_notes || null,
      issue_date: formData.issue_date,
      due_date: new Date(formData.due_date).toISOString(),
      tax_inclusive: formData.tax_inclusive,
      billing_contact_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: invData, error: invError } = await supabase.from('invoices').insert([invoiceData]).select('id').single();

    if (invError || !invData) {
      setErrors({ submit: 'Failed to create invoice. ' + (invError?.message || '') });
      setLoading(false);
      return;
    }

    const linesToInsert = lineItems.map((l, i) => {
      const lineGross = (l.quantity || 0) * (l.unit_price || 0);
      const afterDiscount = lineGross - (l.discount || 0);
      const taxAmt = afterDiscount * ((l.tax_rate || 0) / 100);
      return {
        invoice_id: (invData as { id: string }).id,
        description: l.description.trim(),
        quantity: l.quantity || 1,
        unit_price: l.unit_price || 0,
        discount: l.discount || 0,
        tax_rate: l.tax_rate || 0,
        tax_amount: Math.round(taxAmt * 100) / 100,
        line_total: Math.round((afterDiscount + taxAmt) * 100) / 100,
        order_index: i,
      };
    });

    const { error: linesError } = await supabase.from('invoice_line_items').insert(linesToInsert);

    if (linesError) {
      await supabase.from('invoices').delete().eq('id', (invData as { id: string }).id);
      setErrors({ submit: 'Failed to create line items' });
    } else {
      setFormData({
        client_id: '', project_id: '', description: '', currency: 'GBP',
        payment_terms: 'NET_30', purchase_order_reference: '',
        client_notes: '', internal_notes: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        tax_inclusive: false,
      });
      setLineItems([{ key: '1', description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 20 }]);
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Invoice</h3>
                  <p className="text-xs text-slate-400">Add line items, tax, and client details</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client</label>
                  {fetchingData ? (
                    <div className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      <span className="text-slate-500 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <select value={formData.client_id} onChange={(e) => { setFormData(prev => ({ ...prev, client_id: e.target.value })); if (errors.client_id) setErrors(prev => ({ ...prev, client_id: '' })); }}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none pr-8 ${errors.client_id ? 'border-red-400/30 bg-red-500/5' : 'border-[rgba(255,255,255,0.08)]'}`}
                    >
                      <option value="">Select client...</option>
                      {clients.map((c: Record<string, unknown>) => (
                        <option key={String(c.id)} value={String(c.id)}>{String(c.company_name || c.contact_name || 'Unknown')}</option>
                      ))}
                    </select>
                  )}
                  {errors.client_id && <p className="text-red-400 text-xs mt-1">{errors.client_id}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project (optional)</label>
                  <select value={formData.project_id} onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none pr-8"
                  >
                    <option value="">No project</option>
                    {projects.map((p: Record<string, unknown>) => (
                      <option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <input type="text" value={formData.description} onChange={(e) => { setFormData(prev => ({ ...prev, description: e.target.value })); if (errors.description) setErrors(prev => ({ ...prev, description: '' })); }}
                  placeholder="e.g., Website development - Phase 2" maxLength={500}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all ${errors.description ? 'border-red-400/30 bg-red-500/5' : 'border-[rgba(255,255,255,0.08)]'}`}
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={addLineItem}
                    className="flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Line
                  </button>
                </div>
                <div className="space-y-3">
                  {lineItems.map((item, i) => (
                    <div key={item.key} className="flex items-start gap-2">
                      <div className="flex-1">
                        <input type="text" value={item.description} onChange={(e) => updateLineItem(item.key, 'description', e.target.value)}
                          placeholder="Line item description" className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/40 transition-all"
                        />
                      </div>
                      <input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.key, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01" placeholder="Qty"
                        className="w-16 px-2 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                      />
                      <input type="number" value={item.unit_price} onChange={(e) => updateLineItem(item.key, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01" placeholder="Price"
                        className="w-20 px-2 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                      />
                      <input type="number" value={item.discount} onChange={(e) => updateLineItem(item.key, 'discount', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01" placeholder="Disc"
                        className="w-16 px-2 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                      />
                      <input type="number" value={item.tax_rate} onChange={(e) => updateLineItem(item.key, 'tax_rate', parseFloat(e.target.value) || 0)}
                        min="0" max="100" step="0.1" placeholder="Tax%"
                        className="w-14 px-2 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                      />
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(item.key)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.lineItems && <p className="text-red-400 text-xs mt-1">{errors.lineItems}</p>}
              </div>

              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calculator className="w-4 h-4" />
                  <span className="text-xs">Calculated Totals</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div><span className="text-slate-400">Subtotal:</span> <span className="text-white font-medium">£{computedTotals.subtotal.toFixed(2)}</span></div>
                  <div><span className="text-slate-400">Tax:</span> <span className="text-white font-medium">£{computedTotals.tax.toFixed(2)}</span></div>
                  <div><span className="text-[#06B6D4] font-bold text-lg">£{computedTotals.total.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none pr-8"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Terms</label>
                  <select value={formData.payment_terms} onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none pr-8"
                  >
                    {PAYMENT_TERMS.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">PO Reference</label>
                  <input type="text" value={formData.purchase_order_reference} onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_reference: e.target.value }))}
                    placeholder="Optional" className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Issue Date</label>
                  <input type="date" value={formData.issue_date} onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client Notes</label>
                  <textarea value={formData.client_notes} onChange={(e) => setFormData(prev => ({ ...prev, client_notes: e.target.value }))}
                    placeholder="Visible to client on invoice" rows={2} maxLength={500}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Internal Notes</label>
                  <textarea value={formData.internal_notes} onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                    placeholder="Internal only, not visible to client" rows={2} maxLength={500}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.tax_inclusive} onChange={(e) => setFormData(prev => ({ ...prev, tax_inclusive: e.target.checked }))}
                  className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer"
                />
                <span className="text-sm text-slate-400">Amounts are tax-inclusive</span>
              </label>

              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
                >Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Invoice</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
