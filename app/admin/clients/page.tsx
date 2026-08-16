'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import AdminShell from '../../../components/admin/AdminShell';
import ClientsOverview from '../../../components/admin/clients/ClientsOverview';
import ClientsTable from '../../../components/admin/clients/ClientsTable';
import ClientForm from './ClientForm';
import { Search, Filter, RefreshCw, UserPlus, ChevronDown, X, Loader2 } from 'lucide-react';

interface ClientRow {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  client_reference: string | null;
  account_manager: string | null;
  health_status: string | null;
  onboarding_state: string | null;
  portal_access_state: string | null;
  last_activity_at: string | null;
  created_at: string | null;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('id, company_name, contact_name, email, phone, status, client_reference, account_manager, health_status, onboarding_state, portal_access_state, last_activity_at, created_at').order('created_at', { ascending: false });
    if (!error && data) { setClients(data as ClientRow[]); setFilteredClients(data as ClientRow[]); }
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => {
    let filtered = clients;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.contact_name?.toLowerCase().includes(q)) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.company_name?.toLowerCase().includes(q)) ||
        (c.client_reference?.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter);
    if (healthFilter !== 'all') filtered = filtered.filter(c => c.health_status === healthFilter);
    setFilteredClients(filtered);
  }, [searchQuery, statusFilter, healthFilter, clients]);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('clients').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? All contacts, services and notes will be permanently removed.')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async (data: any) => {
    if (editingClient) {
      const { error } = await supabase.from('clients').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingClient.id);
      if (!error) setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...data } : c));
    } else {
      const { data: newClient, error } = await supabase.from('clients').insert([data]).select().single();
      if (!error && newClient) setClients(prev => [newClient as ClientRow, ...prev]);
    }
  };

  const clientsList = clients as ClientRow[];

  const stats = {
    total: clientsList.length,
    activeCount: clientsList.filter(c => c.status === 'Active').length,
    onboardingCount: clientsList.filter(c => c.onboarding_state === 'in_progress').length,
    attentionCount: clientsList.filter(c => c.health_status === 'Attention Required' || c.health_status === 'Critical').length,
    withoutManager: clientsList.filter(c => !c.account_manager).length,
    overdueTasksCount: 0,
    openIssuesCount: 0,
    unpaidInvoicesCount: 0,
    recentCount: clientsList.filter(c => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      const now = new Date();
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    }).length,
    archivedCount: clientsList.filter(c => c.status === 'Archived').length,
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Clients</h1>
            <p className="text-sm text-slate-400 mt-0.5">Client 360 account management</p>
          </div>
          <button
            onClick={() => { setEditingClient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        <ClientsOverview {...stats} />

        <div className="mt-8 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, company or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Paused">Paused</option>
                  <option value="Offboarding">Offboarding</option>
                  <option value="Former Client">Former Client</option>
                  <option value="Archived">Archived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Health</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Watch">Watch</option>
                  <option value="Attention Required">Attention Required</option>
                  <option value="Critical">Critical</option>
                  <option value="Not Enough Data">Not Enough Data</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => { setRefreshing(true); fetchClients(); }}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <ClientsTable clients={filteredClients as any} onEdit={(c: any) => { setEditingClient(c); setShowForm(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} />

          {filteredClients.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium mb-2">No clients found</p>
              <p className="text-sm text-slate-500 mb-6">{searchQuery || statusFilter !== 'all' || healthFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first client to get started'}</p>
              {!searchQuery && statusFilter === 'all' && healthFilter === 'all' && (
                <button onClick={() => { setEditingClient(null); setShowForm(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Your First Client
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ClientForm client={editingClient} onClose={() => { setShowForm(false); setEditingClient(null); }} onSave={handleSave} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}