'use client';

import { useState } from 'react';
import { Search, Building2, User, Mail, Phone, MapPin, Globe, Plus } from 'lucide-react';
import type { WizardData, ClientInfo, ValidationError } from '@/lib/wizard-types';

interface Step1Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
  clients: ClientInfo[];
  clientsLoading: boolean;
  validationErrors: ValidationError[];
  onRefreshClients: () => void;
}

export default function Step1ClientDetails({
  data, onChange, clients, clientsLoading, validationErrors, onRefreshClients,
}: Step1Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const update = (partial: Partial<WizardData>) => onChange({ ...data, ...partial });

  const updateNewClient = (field: string, value: string) => {
    onChange({
      ...data,
      newClient: { ...data.newClient, [field]: value },
    });
  };

  const filteredClients = searchTerm
    ? clients.filter(c =>
        (c.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clients;

  const getFieldError = (field: string) => validationErrors.find(e => e.field === field);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Client Details</h2>
        <p className="text-sm text-slate-400 mt-1">Select an existing client or create a new one.</p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => update({ clientMode: 'existing' })}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            data.clientMode === 'existing' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Existing Client
        </button>
        <button
          onClick={() => update({ clientMode: 'new' })}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            data.clientMode === 'new' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          New Client
        </button>
      </div>

      {data.clientMode === 'existing' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients by name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
            />
            <button
              onClick={onRefreshClients}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F172A]/50">
            {clientsLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No clients found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search or switch to &ldquo;New Client&rdquo; mode.</p>
              </div>
            ) : (
              filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => update({ existingClientId: c.id })}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all cursor-pointer rounded-lg ${
                    data.existingClientId === c.id
                      ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[#06B6D4]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.company_name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-400 truncate">{c.contact_name}{c.email ? ` · ${c.email}` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {data.existingClientId && (
            <SelectedClientPreview client={clients.find(c => c.id === data.existingClientId) || null} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="Company Name"
            value={data.newClient.company_name}
            onChange={(v) => updateNewClient('company_name', v)}
            placeholder="Enter company name"
            icon={Building2}
            required
            error={getFieldError('company_name')?.message}
          />
          <FieldInput
            label="Contact Name"
            value={data.newClient.contact_name}
            onChange={(v) => updateNewClient('contact_name', v)}
            placeholder="Primary contact person"
            icon={User}
            required
            error={getFieldError('contact_name')?.message}
          />
          <FieldInput
            label="Email"
            value={data.newClient.email}
            onChange={(v) => updateNewClient('email', v)}
            placeholder="client@example.com"
            icon={Mail}
            type="email"
            required
            error={getFieldError('email')?.message}
          />
          <FieldInput
            label="Phone"
            value={data.newClient.phone}
            onChange={(v) => updateNewClient('phone', v)}
            placeholder="+44 20 1234 5678"
            icon={Phone}
          />
          <FieldInput
            label="Address"
            value={data.newClient.address}
            onChange={(v) => updateNewClient('address', v)}
            placeholder="Street, city, postcode"
            icon={MapPin}
          />
          <FieldInput
            label="Website"
            value={data.newClient.website}
            onChange={(v) => updateNewClient('website', v)}
            placeholder="www.example.com"
            icon={Globe}
          />
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Industry</label>
            <select
              value={data.newClient.industry}
              onChange={(e) => updateNewClient('industry', e.target.value)}
              className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all cursor-pointer appearance-none"
            >
              <option value="">Select industry</option>
              {['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Real Estate', 'Education', 'Hospitality', 'Legal', 'Construction', 'Transport', 'Energy', 'Media', 'Non-Profit', 'Public Sector', 'Other'].map(i => (
                <option key={i} value={i} className="bg-[#1E293B]">{i}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {validationErrors.some(e => !e.field.includes('.')) && data.clientMode === 'existing' && (
        <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs">
          Please select an existing client.
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, icon: Icon, type = 'text', required = false, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; type?: string; required?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-9 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${
            error ? 'border-[#EF4444]/50 focus:border-[#EF4444] focus:ring-[#EF4444]/15' : 'border-[rgba(255,255,255,0.08)] focus:border-[#06B6D4]/30'
          }`}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-[10px] text-[#EF4444] mt-1">{error}</p>}
    </div>
  );
}

function SelectedClientPreview({ client }: { client: ClientInfo | null }) {
  if (!client) return null;
  return (
    <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/15 rounded-xl p-4">
      <p className="text-[10px] text-[#06B6D4] uppercase font-semibold tracking-wider mb-2">Selected Client</p>
      <p className="text-sm font-medium text-white">{client.company_name || 'Unnamed'}</p>
      <p className="text-xs text-slate-400 mt-0.5">{client.contact_name}</p>
      {client.email && <p className="text-xs text-slate-400">{client.email}</p>}
    </div>
  );
}