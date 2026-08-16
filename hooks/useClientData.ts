'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ClientRow {
  id: string;
  user_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  industry: string | null;
  status: string;
  project_lead: string | null;
  lead_id: string | null;
  notes: string | null;
  client_reference: string | null;
  trading_name: string | null;
  client_type: string | null;
  account_manager: string | null;
  service_owner: string | null;
  company_number: string | null;
  vat_number: string | null;
  timezone: string | null;
  preferred_contact_method: string | null;
  billing_contact_id: string | null;
  billing_currency: string | null;
  service_start_date: string | null;
  service_renewal_date: string | null;
  onboarding_state: string | null;
  offboarding_state: string | null;
  portal_access_state: string | null;
  data_classification: string | null;
  health_status: string | null;
  health_factors: { factor: string }[] | null;
  health_calculated_at: string | null;
  archived_at: string | null;
  last_activity_at: string | null;
  attention_needed: boolean | null;
  attention_reasons: { reason: string }[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: string | null;
  is_primary: boolean;
  is_billing: boolean;
  is_technical: boolean;
  is_decision_maker: boolean;
  portal_access: boolean;
  contact_permission: boolean;
  verified_at: string | null;
  is_archived: boolean;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClientService {
  id: string;
  client_id: string;
  service_reference: string | null;
  service_type: string;
  product_name: string | null;
  status: string;
  owner_id: string | null;
  project_id: string | null;
  start_date: string | null;
  renewal_date: string | null;
  billing_arrangement: string | null;
  environment: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClientNote {
  id: string;
  client_id: string;
  author_id: string;
  content: string;
  visibility: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PortalAccess {
  id: string;
  client_id: string;
  contact_id: string | null;
  user_id: string | null;
  access_role: string;
  project_ids: string[] | null;
  service_ids: string[] | null;
  invitation_state: string;
  invited_at: string | null;
  accepted_at: string | null;
  last_login_at: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  created_at: string | null;
}

export interface OnboardingItem {
  id: string;
  client_id: string;
  item_key: string;
  label: string;
  owner_id: string | null;
  due_date: string | null;
  status: string;
  evidence: string | null;
  notes: string | null;
}

export function useClientData(clientId?: string) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [services, setServices] = useState<ClientService[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [portalAccess, setPortalAccess] = useState<PortalAccess[]>([]);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    setClients(data as ClientRow[] || []);
    setLoading(false);
  }, []);

  const fetchClient = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
    if (err) { setError(err.message); setLoading(false); return; }
    setClient(data as ClientRow | null);
    setLoading(false);
  }, []);

  const fetchContacts = useCallback(async (id: string) => {
    const { data } = await supabase.from('client_contacts').select('*').eq('client_id', id).order('is_primary', { ascending: false });
    if (data) setContacts(data as ClientContact[]);
  }, []);

  const fetchServices = useCallback(async (id: string) => {
    const { data } = await supabase.from('client_services').select('*').eq('client_id', id).order('created_at', { ascending: false });
    if (data) setServices(data as ClientService[]);
  }, []);

  const fetchNotes = useCallback(async (id: string) => {
    const { data } = await supabase.from('client_notes').select('*').eq('client_id', id).order('created_at', { ascending: false });
    if (data) setNotes(data as ClientNote[]);
  }, []);

  const fetchPortalAccess = useCallback(async (id: string) => {
    const { data } = await supabase.from('portal_access').select('*').eq('client_id', id);
    if (data) setPortalAccess(data as PortalAccess[]);
  }, []);

  const fetchOnboarding = useCallback(async (id: string) => {
    const { data } = await supabase.from('client_onboarding_items').select('*').eq('client_id', id);
    if (data) setOnboardingItems(data as OnboardingItem[]);
  }, []);

  const updateClient = useCallback(async (id: string, updates: Partial<ClientRow>) => {
    const { error: err } = await supabase.from('clients').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) return { error: err.message };
    setClient(prev => prev ? { ...prev, ...updates } : null);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return { error: null };
  }, []);

  const createClient = useCallback(async (data: Partial<ClientRow>) => {
    const { data: newClient, error: err } = await supabase.from('clients').insert([data]).select().single();
    if (err) return { error: err.message, data: null };
    setClients(prev => [newClient as ClientRow, ...prev]);
    return { error: null, data: newClient as ClientRow };
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('clients').delete().eq('id', id);
    if (err) return { error: err.message };
    setClients(prev => prev.filter(c => c.id !== id));
    return { error: null };
  }, []);

  const addContact = useCallback(async (data: Partial<ClientContact>) => {
    const { data: newContact, error: err } = await supabase.from('client_contacts').insert([data]).select().single();
    if (err) return { error: err.message, data: null };
    setContacts(prev => [...prev, newContact as ClientContact]);
    return { error: null, data: newContact as ClientContact };
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<ClientContact>) => {
    const { error: err } = await supabase.from('client_contacts').update(updates).eq('id', id);
    if (err) return { error: err.message };
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return { error: null };
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('client_contacts').delete().eq('id', id);
    if (err) return { error: err.message };
    setContacts(prev => prev.filter(c => c.id !== id));
    return { error: null };
  }, []);

  const addNote = useCallback(async (data: Partial<ClientNote>) => {
    const { data: newNote, error: err } = await supabase.from('client_notes').insert([data]).select().single();
    if (err) return { error: err.message, data: null };
    setNotes(prev => [...prev, newNote as ClientNote]);
    return { error: null, data: newNote as ClientNote };
  }, []);

  const addService = useCallback(async (data: Partial<ClientService>) => {
    const { data: newService, error: err } = await supabase.from('client_services').insert([data]).select().single();
    if (err) return { error: err.message, data: null };
    setServices(prev => [...prev, newService as ClientService]);
    return { error: null, data: newService as ClientService };
  }, []);

  const updateService = useCallback(async (id: string, updates: Partial<ClientService>) => {
    const { error: err } = await supabase.from('client_services').update(updates).eq('id', id);
    if (err) return { error: err.message };
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return { error: null };
  }, []);

  const updateOnboardingItem = useCallback(async (id: string, updates: Partial<OnboardingItem>) => {
    const { error: err } = await supabase.from('client_onboarding_items').update(updates).eq('id', id);
    if (err) return { error: err.message };
    setOnboardingItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    return { error: null };
  }, []);

  const addOnboardingItem = useCallback(async (data: Partial<OnboardingItem>) => {
    const { data: newItem, error: err } = await supabase.from('client_onboarding_items').insert([data]).select().single();
    if (err) return { error: err.message, data: null };
    setOnboardingItems(prev => [...prev, newItem as OnboardingItem]);
    return { error: null, data: newItem as OnboardingItem };
  }, []);

  const addPortalAccess = useCallback(async (data: Partial<PortalAccess>) => {
    const { data: newAccess, error: err } = await supabase.from('portal_access').insert([data]).select().single();
    if (err) return { error: err.message, data: null };
    setPortalAccess(prev => [...prev, newAccess as PortalAccess]);
    return { error: null, data: newAccess as PortalAccess };
  }, []);

  const updatePortalAccess = useCallback(async (id: string, updates: Partial<PortalAccess>) => {
    const { error: err } = await supabase.from('portal_access').update(updates).eq('id', id);
    if (err) return { error: err.message };
    setPortalAccess(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return { error: null };
  }, []);

  return {
    clients, client, contacts, services, notes, portalAccess, onboardingItems,
    loading, error,
    fetchClients, fetchClient, fetchContacts, fetchServices, fetchNotes,
    fetchPortalAccess, fetchOnboarding,
    updateClient, createClient, deleteClient,
    addContact, updateContact, deleteContact,
    addNote, addService, updateService,
    updateOnboardingItem, addOnboardingItem,
    addPortalAccess, updatePortalAccess,
  };
}