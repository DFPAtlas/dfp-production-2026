'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CmsPage {
  id: string;
  reference: string;
  title: string;
  slug: string;
  route: string;
  page_type: string;
  nav_label: string | null;
  nav_visible: boolean;
  summary: string | null;
  editorial_status: string;
  approval_status: string;
  visibility_status: string;
  owner_id: string | null;
  reviewer_id: string | null;
  approver_id: string | null;
  published_at: string | null;
  review_due_at: string | null;
  archived_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsSection {
  id: string;
  page_id: string;
  section_type: string;
  internal_label: string | null;
  heading: string | null;
  content: Record<string, unknown> | null;
  sort_order: number;
  visible: boolean;
}

export interface CmsNavItem {
  id: string;
  area: string;
  label: string;
  destination: string;
  destination_type: string;
  parent_id: string | null;
  sort_order: number;
  visibility: string;
  status: string;
}

export interface CmsMedia {
  id: string;
  file_name: string;
  title: string | null;
  alt_text: string | null;
  caption: string | null;
  mime_type: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  public_url: string | null;
  classification: string;
  usage_count: number;
  created_at: string;
}

export interface CmsService {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  status: string;
  sort_order: number;
  icon: string | null;
  color: string | null;
}

export interface CmsStaff {
  id: string;
  name: string;
  role: string | null;
  biography: string | null;
  image_url: string | null;
  status: string;
  display_order: number;
}

export interface CmsCaseStudy {
  id: string;
  title: string;
  slug: string;
  industry: string | null;
  challenge: string | null;
  status: string;
  published_at: string | null;
}

export interface CmsTestimonial {
  id: string;
  source_name: string;
  role_company: string | null;
  quote: string;
  status: string;
}

export interface CmsFaq {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  status: string;
  sort_order: number;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  style: string;
  audience: string;
  status: string;
  active_from: string;
  active_until: string | null;
}

export interface CmsLegal {
  id: string;
  title: string;
  slug: string;
  version: number;
  status: string;
  effective_date: string | null;
  published_at: string | null;
}

export interface CmsRedirect {
  id: string;
  source_path: string;
  destination_path: string;
  redirect_type: number;
  active: boolean;
  test_status: string | null;
}

export interface CmsMetrics {
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  reviewPages: number;
  approvedPages: number;
  scheduledPages: number;
  recentPublications: number;
  expiredReview: number;
  activeRedirects: number;
  mediaCount: number;
}

export function useCmsMetrics() {
  const [metrics, setMetrics] = useState<CmsMetrics>({
    totalPages: 0, publishedPages: 0, draftPages: 0, reviewPages: 0,
    approvedPages: 0, scheduledPages: 0, recentPublications: 0,
    expiredReview: 0, activeRedirects: 0, mediaCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [
        { data: pages }, { data: scheduled }, { data: redirects }, { data: media }
      ] = await Promise.all([
        supabase.from('cms_pages').select('editorial_status,visibility_status,review_due_at,published_at,archived_at'),
        supabase.from('cms_publishing_schedule').select('id,status').eq('status', 'Scheduled'),
        supabase.from('cms_redirects').select('id,active'),
        supabase.from('cms_media').select('id'),
      ]);
      if (cancelled) return;
      const all = (pages || []).filter(p => !p.archived_at);
      const now = new Date();
      setMetrics({
        totalPages: all.length,
        publishedPages: all.filter(p => p.visibility_status === 'Published').length,
        draftPages: all.filter(p => p.editorial_status === 'Draft').length,
        reviewPages: all.filter(p => ['Ready for Review', 'Changes Requested'].includes(p.editorial_status || '')).length,
        approvedPages: all.filter(p => p.editorial_status === 'Approved').length,
        scheduledPages: (scheduled || []).length,
        recentPublications: all.filter(p => p.published_at && new Date(p.published_at) > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)).length,
        expiredReview: all.filter(p => p.review_due_at && new Date(p.review_due_at) < now).length,
        activeRedirects: (redirects || []).filter(r => r.active).length,
        mediaCount: (media || []).length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export function useCmsPages() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cms_pages').select('*').order('updated_at', { ascending: false });
    setPages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { pages, loading, refetch: fetch };
}

export function useCmsSections(pageId: string | null) {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pageId) { setSections([]); return; }
    setLoading(true);
    supabase.from('cms_page_sections').select('*').eq('page_id', pageId).order('sort_order').then(({ data }) => {
      setSections(data || []);
      setLoading(false);
    });
  }, [pageId]);

  return { sections, loading };
}

export function useCmsNavigation(area?: string) {
  const [items, setItems] = useState<CmsNavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('cms_navigation').select('*').order('sort_order');
    if (area) q = q.eq('area', area);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }, [area]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch };
}

export function useCmsMedia() {
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cms_media').select('*').order('created_at', { ascending: false });
    setMedia(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { media, loading, refetch: fetch };
}

export function useCmsServices() {
  const [services, setServices] = useState<CmsService[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_services').select('*').order('sort_order').then(({ data }) => {
      setServices(data || []);
      setLoading(false);
    });
  }, []);
  return { services, loading, refetch: () => {} };
}

export function useCmsStaff() {
  const [staff, setStaff] = useState<CmsStaff[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_staff').select('*').order('display_order').then(({ data }) => {
      setStaff(data || []);
      setLoading(false);
    });
  }, []);
  return { staff, loading, refetch: () => {} };
}

export function useCmsCaseStudies() {
  const [items, setItems] = useState<CmsCaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_case_studies').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return { items, loading, refetch: () => {} };
}

export function useCmsTestimonials() {
  const [items, setItems] = useState<CmsTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_testimonials').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return { items, loading, refetch: () => {} };
}

export function useCmsFaqs() {
  const [items, setItems] = useState<CmsFaq[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_faqs').select('*').order('sort_order').then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return { items, loading, refetch: () => {} };
}

export function useCmsAnnouncements() {
  const [items, setItems] = useState<CmsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_announcements').select('*').order('active_from', { ascending: false }).then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return { items, loading, refetch: () => {} };
}

export function useCmsLegal() {
  const [items, setItems] = useState<CmsLegal[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_legal').select('*').order('version', { ascending: false }).then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return { items, loading, refetch: () => {} };
}

export interface ProductRegistry {
  id: string;
  organisation_id: string | null;
  product_name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  product_category: string | null;
  target_audience: string | null;
  primary_problem: string | null;
  product_status: string;
  public_visibility: string;
  launch_stage: string | null;
  website_domain: string | null;
  public_url: string | null;
  logo_asset_id: string | null;
  hero_asset_id: string | null;
  card_asset_id: string | null;
  brand_kit_id: string | null;
  primary_cta_type: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  feature_summary: Record<string, unknown>[] | null;
  key_benefits: string[] | null;
  industries: string[] | null;
  availability_notes: string | null;
  pricing_status: string | null;
  demo_status: string | null;
  early_access_status: string | null;
  support_status: string | null;
  sort_order: number;
  is_featured: boolean;
  featured_sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_asset_id: string | null;
  structured_data: Record<string, unknown> | null;
  owner_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export function useProductRegistry(options?: { visibility?: string }) {
  const [products, setProducts] = useState<ProductRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const visibility = options?.visibility;

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('product_registry').select('*').order('sort_order');
    if (visibility) q = q.eq('public_visibility', visibility);
    const { data } = await q;
    setProducts((data || []) as ProductRegistry[]);
    setLoading(false);
  }, [visibility]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let q = supabase.from('product_registry').select('*').order('sort_order');
      if (visibility) q = q.eq('public_visibility', visibility);
      const { data } = await q;
      if (cancelled) return;
      setProducts((data || []) as ProductRegistry[]);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [visibility]);

  return { products, loading, refetch: fetch };
}

export function useProductMetrics() {
  const [metrics, setMetrics] = useState({ total: 0, live: 0, beta: 0, comingSoon: 0, featured: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('product_registry').select('product_status,is_featured,public_visibility');
      if (cancelled) return;
      const all = (data || []).filter((p: any) => p.public_visibility === 'Public');
      setMetrics({
        total: all.length,
        live: all.filter((p: any) => p.product_status === 'Live').length,
        beta: all.filter((p: any) => ['Public Beta', 'Private Beta'].includes(p.product_status)).length,
        comingSoon: all.filter((p: any) => p.product_status === 'Launching Soon').length,
        featured: all.filter((p: any) => p.is_featured).length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export function useCmsRedirects() {
  const [items, setItems] = useState<CmsRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('cms_redirects').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return { items, loading, refetch: () => {} };
}

export interface PublicTeamProfile {
  id: string;
  organisation_id: string | null;
  staff_profile_id: string | null;
  public_name: string;
  slug: string;
  public_job_title: string | null;
  department: string | null;
  leadership_level: string | null;
  short_bio: string | null;
  full_bio: string | null;
  responsibilities: string[] | null;
  specialist_areas: string[] | null;
  experience_summary: string[] | null;
  qualifications: string[] | null;
  products: string[] | null;
  services: string[] | null;
  profile_asset_id: string | null;
  image_alt_text: string | null;
  professional_links: Record<string, string> | null;
  display_order: number;
  featured: boolean;
  public_status: string;
  consent_confirmed_at: string | null;
  consent_confirmed_by: string | null;
  content_owner_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export function useTeamProfiles() {
  const [profiles, setProfiles] = useState<PublicTeamProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('public_team_profiles').select('*').order('display_order');
    setProfiles((data || []) as PublicTeamProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { profiles, loading, refetch: fetch };
}

export function useTeamProfileMetrics() {
  const [metrics, setMetrics] = useState({ total: 0, published: 0, draft: 0, featured: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('public_team_profiles').select('public_status,featured');
      if (cancelled) return;
      const all = data || [];
      setMetrics({
        total: all.length,
        published: all.filter((p: any) => p.public_status === 'Published').length,
        draft: all.filter((p: any) => p.public_status === 'Draft').length,
        featured: all.filter((p: any) => p.featured).length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export interface DemoRegistry {
  id: string;
  organisation_id: string | null;
  product_id: string | null;
  demo_name: string;
  slug: string;
  short_description: string | null;
  demo_format: string;
  demo_status: string;
  public_visibility: string;
  target_audience: string | null;
  estimated_duration: string | null;
  demo_asset_id: string | null;
  thumbnail_asset_id: string | null;
  video_asset_id: string | null;
  sandbox_url: string | null;
  tour_definition: Record<string, unknown>[] | null;
  screenshot_sequence: Record<string, unknown>[] | null;
  sample_data_profile_id: string | null;
  access_method: string | null;
  access_expiry: string | null;
  primary_cta: string | null;
  request_form_enabled: boolean;
  instructions: string | null;
  limitations: string | null;
  privacy_notice: string | null;
  is_featured: boolean;
  featured_sort_order: number;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_asset_id: string | null;
  owner_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export function useDemoRegistry() {
  const [demos, setDemos] = useState<DemoRegistry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('demo_registry').select('*').order('sort_order');
    setDemos((data || []) as DemoRegistry[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { demos, loading, refetch: fetch };
}

export function useDemoMetrics() {
  const [metrics, setMetrics] = useState({ total: 0, publicDemos: 0, publicPreviews: 0, featured: 0, comingSoon: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('demo_registry').select('demo_format,demo_status,public_visibility,is_featured,archived_at');
      if (cancelled) return;
      const all = (data || []).filter((d: any) => !d.archived_at);
      setMetrics({
        total: all.length,
        publicDemos: all.filter((d: any) => d.demo_status === 'Public demo' && d.public_visibility === 'Public demo').length,
        publicPreviews: all.filter((d: any) => d.public_visibility === 'Public preview').length,
        featured: all.filter((d: any) => d.is_featured).length,
        comingSoon: all.filter((d: any) => d.demo_format === 'coming_soon').length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export interface HelpArticle {
  id: string;
  organisation_id: string | null;
  title: string;
  slug: string;
  summary: string | null;
  category_id: string | null;
  category_label: string | null;
  audience: string;
  product_id: string | null;
  portal_scope: string | null;
  content_document: Record<string, unknown>[] | null;
  rendered_content: string | null;
  search_keywords: string[] | null;
  related_articles: string[] | null;
  related_routes: string[] | null;
  article_status: string;
  public_visibility: string;
  is_featured: boolean;
  sort_order: number;
  helpful_count: number;
  not_helpful_count: number;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  last_reviewed_at: string | null;
  review_due_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export function useHelpArticles() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('help_articles').select('*').order('sort_order');
    setArticles((data || []) as HelpArticle[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { articles, loading, refetch: fetch };
}

export function useHelpArticleMetrics() {
  const [metrics, setMetrics] = useState({ total: 0, published: 0, draft: 0, featured: 0, outdated: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('help_articles').select('article_status,is_featured,archived_at');
      if (cancelled) return;
      const all = (data || []).filter((a: any) => !a.archived_at);
      setMetrics({
        total: all.length,
        published: all.filter((a: any) => a.article_status === 'Published').length,
        draft: all.filter((a: any) => a.article_status === 'Draft').length,
        featured: all.filter((a: any) => a.is_featured).length,
        outdated: all.filter((a: any) => a.article_status === 'Outdated').length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export interface PartnerApplication {
  id: string;
  organisation_id: string | null;
  application_type: string;
  company_name: string;
  applicant_name: string;
  email: string;
  telephone: string | null;
  website: string | null;
  company_number: string | null;
  region: string | null;
  capabilities: Record<string, unknown> | null;
  products_or_services: Record<string, unknown> | null;
  referral_details: Record<string, unknown> | null;
  proposed_relationship: string | null;
  experience_summary: string | null;
  compliance_answers: Record<string, unknown> | null;
  conflict_declaration: string | null;
  privacy_acknowledged_at: string | null;
  status: string;
  assigned_owner_id: string | null;
  linked_company_id: string | null;
  linked_contact_id: string | null;
  linked_lead_id: string | null;
  review_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePartnerApplications() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('partner_applications').select('*').order('created_at', { ascending: false });
    setApplications((data || []) as PartnerApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { applications, loading, refetch: fetch };
}

export function usePartnerMetrics() {
  const [metrics, setMetrics] = useState({ total: 0, submitted: 0, underReview: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('partner_applications').select('status,archived_at');
      if (cancelled) return;
      const all = (data || []).filter((a: any) => !a.archived_at);
      setMetrics({
        total: all.length,
        submitted: all.filter((a: any) => a.status === 'Submitted').length,
        underReview: all.filter((a: any) => ['Screening', 'Under review', 'Due diligence', 'More information required'].includes(a.status)).length,
        approved: all.filter((a: any) => a.status === 'Approved').length,
        pending: all.filter((a: any) => ['Meeting requested', 'On hold'].includes(a.status)).length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export interface CareersVacancy {
  id: string;
  organisation_id: string | null;
  reference: string | null;
  title: string;
  slug: string;
  department: string | null;
  reports_to_public_label: string | null;
  employment_type: string;
  work_location_type: string;
  location_text: string | null;
  summary: string | null;
  responsibilities: Record<string, unknown>[] | null;
  essential_requirements: Record<string, unknown>[] | null;
  desirable_requirements: Record<string, unknown>[] | null;
  salary_visibility: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  salary_period: string | null;
  benefits: Record<string, unknown>[] | null;
  application_questions: Record<string, unknown>[] | null;
  closing_date: string | null;
  expected_start_information: string | null;
  hiring_manager_id: string | null;
  recruiter_id: string | null;
  vacancy_status: string;
  public_visibility: string;
  is_featured: boolean;
  sort_order: number;
  approved_by: string | null;
  approved_at: string | null;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CareerApplication {
  id: string;
  organisation_id: string | null;
  vacancy_id: string | null;
  candidate_name: string;
  candidate_email: string;
  telephone: string | null;
  location: string | null;
  work_eligibility_response: string | null;
  cv_file_id: string | null;
  cover_note: string | null;
  portfolio_url: string | null;
  answers: Record<string, unknown>[] | null;
  adjustment_request: string | null;
  future_opportunity_consent: boolean;
  source: string;
  application_status: string;
  assigned_reviewer_id: string | null;
  submitted_at: string | null;
  updated_at: string;
  withdrawn_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export function useCareersVacancies() {
  const [vacancies, setVacancies] = useState<CareersVacancy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('careers_vacancies').select('*').order('sort_order');
    setVacancies((data || []) as CareersVacancy[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { vacancies, loading, refetch: fetch };
}

export function useCareerApplications() {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('career_applications').select('*').order('created_at', { ascending: false });
    setApplications((data || []) as CareerApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { applications, loading, refetch: fetch };
}

export function useCareersMetrics() {
  const [metrics, setMetrics] = useState({ totalVacancies: 0, openVacancies: 0, totalApplications: 0, submittedApps: 0, screeningApps: 0, hired: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [{ data: vacs }, { data: apps }] = await Promise.all([
        supabase.from('careers_vacancies').select('vacancy_status,archived_at'),
        supabase.from('career_applications').select('application_status,archived_at'),
      ]);
      if (cancelled) return;
      const activeVacs = (vacs || []).filter((v: any) => !v.archived_at);
      const activeApps = (apps || []).filter((a: any) => !a.archived_at);
      setMetrics({
        totalVacancies: activeVacs.length,
        openVacancies: activeVacs.filter((v: any) => v.vacancy_status === 'Open').length,
        totalApplications: activeApps.length,
        submittedApps: activeApps.filter((a: any) => a.application_status === 'Submitted').length,
        screeningApps: activeApps.filter((a: any) => ['Screening', 'Shortlist review'].includes(a.application_status)).length,
        hired: activeApps.filter((a: any) => a.application_status === 'Hired').length,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading };
}

export const VACANCY_STATUSES = ['Draft', 'Open', 'Under Review', 'Interviewing', 'Offer', 'Filled', 'On Hold', 'Closed', 'Archived'] as const;
export type VacancyStatus = typeof VACANCY_STATUSES[number];

export const vacancyStatusConfig: Record<VacancyStatus, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8' },
  'Open': { label: 'Open', color: '#10B981' },
  'Under Review': { label: 'Under Review', color: '#8B5CF6' },
  'Interviewing': { label: 'Interviewing', color: '#06B6D4' },
  'Offer': { label: 'Offer', color: '#F59E0B' },
  'Filled': { label: 'Filled', color: '#3B82F6' },
  'On Hold': { label: 'On Hold', color: '#EF4444' },
  'Closed': { label: 'Closed', color: '#6B7280' },
  'Archived': { label: 'Archived', color: '#9CA3AF' },
};

export const APPLICATION_STATUSES = ['Draft', 'Submitted', 'Screening', 'Shortlist review', 'Interview', 'Technical assessment', 'Offer', 'Hired', 'Rejected', 'Withdrawn', 'On hold'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const applicationStatusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8' },
  'Submitted': { label: 'Submitted', color: '#06B6D4' },
  'Screening': { label: 'Screening', color: '#8B5CF6' },
  'Shortlist review': { label: 'Shortlist Review', color: '#F59E0B' },
  'Interview': { label: 'Interview', color: '#EC4899' },
  'Technical assessment': { label: 'Tech Assessment', color: '#3B82F6' },
  'Offer': { label: 'Offer', color: '#10B981' },
  'Hired': { label: 'Hired', color: '#059669' },
  'Rejected': { label: 'Rejected', color: '#EF4444' },
  'Withdrawn': { label: 'Withdrawn', color: '#9CA3AF' },
  'On hold': { label: 'On Hold', color: '#6B7280' },
};

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Fixed-term', 'Internship', 'Voluntary', 'Freelance', 'Zero-hours'] as const;
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];

export const employmentTypeConfig: Record<EmploymentType, { label: string }> = {
  'Full-time': { label: 'Full-time' },
  'Part-time': { label: 'Part-time' },
  'Contract': { label: 'Contract' },
  'Fixed-term': { label: 'Fixed Term' },
  'Internship': { label: 'Internship' },
  'Voluntary': { label: 'Voluntary' },
  'Freelance': { label: 'Freelance' },
  'Zero-hours': { label: 'Zero Hours' },
};

export const WORK_LOCATION_TYPES = ['Remote', 'Hybrid', 'On-site', 'Flexible', 'Field-based'] as const;
export type WorkLocationType = typeof WORK_LOCATION_TYPES[number];

export const workLocationTypeConfig: Record<WorkLocationType, { label: string }> = {
  'Remote': { label: 'Remote' },
  'Hybrid': { label: 'Hybrid' },
  'On-site': { label: 'On-site' },
  'Flexible': { label: 'Flexible' },
  'Field-based': { label: 'Field-based' },
};

export const VACANCY_DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Customer Success', 'Operations', 'Finance', 'People', 'Legal', 'Security', 'Data', 'AI/ML', 'Infrastructure', 'Support', 'Leadership', 'Research', 'QA / UAT'] as const;