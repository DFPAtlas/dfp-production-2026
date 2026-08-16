'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import { Bell, AlertTriangle, Info, CheckCheck, Eye, EyeOff, Search, RefreshCw } from 'lucide-react';



export default function CommandAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase.from('digital_footprint_alerts').select('*, digital_footprint_projects!inner(name)').order('created_at', { ascending: false });
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = alerts;
    if (!showResolved) filtered = filtered.filter(a => !a.is_resolved);
    if (typeFilter !== 'all') filtered = filtered.filter(a => a.alert_type === typeFilter);
    if (sourceFilter !== 'all') filtered = filtered.filter(a => a.source === sourceFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q)));
    }
    setFilteredAlerts(filtered);
  }, [searchQuery, typeFilter, sourceFilter, showResolved, alerts]);

  const resolveAlert = async (id: string) => {
    await supabase.from('digital_footprint_alerts').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
    fetchAlerts();
  };

  const markRead = async (id: string) => {
    await supabase.from('digital_footprint_alerts').update({ is_read: true }).eq('id', id);
    fetchAlerts();
  };

  const getTypeStyle = (t: string) => {
    switch (t) { case 'critical': return { color: '#EF4444', bg: 'bg-red-500/10', icon: AlertTriangle }; case 'warning': return { color: '#F59E0B', bg: 'bg-amber-500/10', icon: AlertTriangle }; default: return { color: '#3B82F6', bg: 'bg-blue-500/10', icon: Info }; }
  };

  const criticalCount = alerts.filter(a => a.alert_type === 'critical' && !a.is_resolved).length;
  const warningCount = alerts.filter(a => a.alert_type === 'warning' && !a.is_resolved).length;

  if (loading) {
    return <CommandShell><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div></CommandShell>;
  }

  return (
    <CommandShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Alerts</h1>
          <p className="text-sm text-slate-400">Central alert manager for all systems</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Warnings</div>
            <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Total</div>
            <div className="text-2xl font-bold text-white">{alerts.filter(a => !a.is_resolved).length}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden mb-4">
          <div className="p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" placeholder="Search alerts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
            </div>
            <div className="flex gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                <option value="all">All Types</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="information">Information</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                <option value="all">All Sources</option><option value="app">App</option><option value="database">Database</option><option value="n8n">n8n</option><option value="deployment">Deployment</option><option value="backup">Backup</option><option value="payment">Payment</option><option value="other">Other</option>
              </select>
              <button onClick={() => setShowResolved(!showResolved)}
                className={`px-3 py-2 rounded-xl text-sm cursor-pointer whitespace-nowrap ${showResolved ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400'}`}>
                {showResolved ? 'Hide Resolved' : 'Show Resolved'}
              </button>
              <button onClick={fetchAlerts} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <CheckCheck className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">All Clear</h3>
            <p className="text-sm text-slate-400">No alerts match your current filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAlerts.map((alert, i) => {
              const ts = getTypeStyle(alert.alert_type);
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl p-4 flex items-start gap-3">
                  <ts.icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: ts.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: ts.color + '20', color: ts.color }}>{alert.alert_type}</span>
                      <span className="text-[10px] text-slate-500">{alert.source}</span>
                      {alert.digital_footprint_projects && <span className="text-[10px] text-slate-500">· {alert.digital_footprint_projects.name}</span>}
                      {alert.is_resolved && <span className="text-[10px] text-green-400">· Resolved</span>}
                    </div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    {alert.description && <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>}
                    <p className="text-[10px] text-slate-600 mt-1">{new Date(alert.created_at).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!alert.is_read && (
                      <button onClick={() => markRead(alert.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!alert.is_resolved && (
                      <button onClick={() => resolveAlert(alert.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-500/10 text-slate-400 hover:text-green-400 transition-colors cursor-pointer">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </CommandShell>
  );
}