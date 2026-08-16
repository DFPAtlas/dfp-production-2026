'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import AdminShell from '@/components/admin/AdminShell';
import CmsOverviewCards from '@/components/admin/cms/CmsOverviewCards';
import {
  useCmsMetrics, useCmsPages, useCmsNavigation, useCmsMedia,
  useCmsServices, useCmsStaff, useCmsCaseStudies, useCmsTestimonials,
  useCmsFaqs, useCmsAnnouncements, useCmsLegal, useCmsRedirects,
  useProductRegistry, useTeamProfiles, useTeamProfileMetrics,
  useDemoRegistry, useDemoMetrics,
  useHelpArticles, useHelpArticleMetrics,
  usePartnerApplications, usePartnerMetrics,
  HelpArticle, CmsService, CmsStaff, CmsCaseStudy,
  CmsTestimonial, CmsFaq, CmsAnnouncement, CmsLegal,
  PublicTeamProfile, DemoRegistry, PartnerApplication,
  useCareersVacancies, useCareerApplications, useCareersMetrics,
  CareersVacancy, CareerApplication,
} from '@/hooks/useCmsData';
import { editorialStatusConfig, productStatusConfig, PRODUCT_STATUSES, PRODUCT_VISIBILITY, TEAM_PROFILE_STATUSES, teamProfileStatusConfig, demoFormatConfig, demoStatusConfig, DEMO_FORMATS, DEMO_STATUSES, DEMO_VISIBILITY, helpArticleStatusConfig, helpCategoryConfig, HELP_ARTICLE_STATUSES, HELP_ARTICLE_VISIBILITY, partnerStatusConfig, PARTNER_APPLICATION_STATUSES, vacancyStatusConfig, applicationStatusConfig, VACANCY_STATUSES, employmentTypeConfig } from '@/lib/cms-definitions';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { key: 'pages', label: 'Pages', icon: 'ri-file-text-line' },
  { key: 'navigation', label: 'Navigation', icon: 'ri-menu-line' },
  { key: 'media', label: 'Media', icon: 'ri-image-line' },
  { key: 'products', label: 'Products', icon: 'ri-stack-line' },
  { key: 'demos', label: 'Demos', icon: 'ri-slideshow-line' },
  { key: 'help-articles', label: 'Help Articles', icon: 'ri-question-line' },
  { key: 'partners', label: 'Partner Applications', icon: 'ri-briefcase-line' },
  { key: 'careers', label: 'Careers', icon: 'ri-user-star-line' },
  { key: 'team-profiles', label: 'Team Profiles', icon: 'ri-user-star-line' },
  { key: 'services', label: 'Services', icon: 'ri-tools-line' },
  { key: 'staff', label: 'Staff', icon: 'ri-team-line' },
  { key: 'case-studies', label: 'Case Studies', icon: 'ri-folder-chart-line' },
  { key: 'testimonials', label: 'Testimonials', icon: 'ri-chat-quote-line' },
  { key: 'faqs', label: 'FAQs', icon: 'ri-question-answer-line' },
  { key: 'announcements', label: 'Announcements', icon: 'ri-megaphone-line' },
  { key: 'legal', label: 'Legal', icon: 'ri-scales-line' },
  { key: 'redirects', label: 'Redirects', icon: 'ri-share-forward-line' },
  { key: 'footer', label: 'Footer', icon: 'ri-layout-bottom-line' },
];

export default function CmsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { metrics, loading: metricsLoading } = useCmsMetrics();
  const { pages, loading: pagesLoading, refetch: refetchPages } = useCmsPages();
  const { items: navItems, loading: navLoading, refetch: refetchNav } = useCmsNavigation();
  const { media, loading: mediaLoading } = useCmsMedia();
  const { services, loading: servicesLoading } = useCmsServices();
  const { staff, loading: staffLoading } = useCmsStaff();
  const { items: caseStudies, loading: csLoading } = useCmsCaseStudies();
  const { items: testimonials, loading: tmLoading } = useCmsTestimonials();
  const { items: faqs, loading: faqsLoading } = useCmsFaqs();
  const { items: announcements, loading: annLoading } = useCmsAnnouncements();
  const { items: legal, loading: legalLoading } = useCmsLegal();
  const { items: redirects, loading: redirLoading } = useCmsRedirects();
  const { products, loading: productsLoading, refetch: refetchProducts } = useProductRegistry();
  const { profiles: teamProfiles, loading: teamProfilesLoading, refetch: refetchTeamProfiles } = useTeamProfiles();
  const { metrics: teamMetrics, loading: teamMetricsLoading } = useTeamProfileMetrics();
  const { demos, loading: demosLoading, refetch: refetchDemos } = useDemoRegistry();
  const { metrics: demoMetrics, loading: demoMetricsLoading } = useDemoMetrics();
  const { articles: helpArticles, loading: helpArticlesLoading, refetch: refetchHelpArticles } = useHelpArticles();
  const { metrics: helpMetrics, loading: helpMetricsLoading } = useHelpArticleMetrics();
  const { applications: partnerApplications, loading: partnerApplicationsLoading, refetch: refetchPartnerApplications } = usePartnerApplications();
  const { metrics: partnerMetrics, loading: partnerMetricsLoading } = usePartnerMetrics();
  const { vacancies: careersVacancies, loading: careersVacanciesLoading, refetch: refetchCareersVacancies } = useCareersVacancies();
  const { applications: careerApplications, loading: careerApplicationsLoading, refetch: refetchCareerApplications } = useCareerApplications();
  const { metrics: careersMetrics, loading: careersMetricsLoading } = useCareersMetrics();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (pageId: string, newStatus: string) => {
    const { error } = await supabase.from('cms_pages').update({ editorial_status: newStatus, updated_at: new Date().toISOString() }).eq('id', pageId);
    if (error) showToast(error.message, 'error');
    else { showToast('Status updated', 'success'); refetchPages(); }
  };

  const handleNavDelete = async (id: string) => {
    const { error } = await supabase.from('cms_navigation').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('Nav item deleted', 'success'); refetchNav(); }
  };

  const handleRedirectDelete = async (id: string) => {
    const { error } = await supabase.from('cms_redirects').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else showToast('Redirect deleted', 'success');
  };

  const filteredPages = pages.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.slug || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'published' && p.visibility_status === 'Published')
      || (statusFilter === 'draft' && p.editorial_status === 'Draft')
      || (statusFilter === 'review' && ['Ready for Review', 'Changes Requested'].includes(p.editorial_status || ''))
      || (statusFilter === 'approved' && p.editorial_status === 'Approved')
      || (statusFilter === 'scheduled' && p.editorial_status === 'Scheduled')
      || (statusFilter === 'overdue' && p.review_due_at && new Date(p.review_due_at) < new Date())
      || (statusFilter === 'recent' && p.published_at && new Date(p.published_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
    return matchSearch && matchStatus;
  });

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published', color: '#10B981' },
    { key: 'draft', label: 'Draft', color: '#94A3B8' },
    { key: 'review', label: 'Review', color: '#3B82F6' },
    { key: 'approved', label: 'Approved', color: '#7C3AED' },
    { key: 'scheduled', label: 'Scheduled', color: '#06B6D4' },
    { key: 'overdue', label: 'Overdue', color: '#EF4444' },
  ];

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Content Management</h1>
          <p className="text-sm text-slate-400">Manage pages, navigation, media, collections, SEO and publishing.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1E293B] p-1 rounded-xl border border-[rgba(255,255,255,0.08)] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`${tab.icon} w-3.5 h-3.5 flex items-center justify-center`} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
              <CmsOverviewCards metrics={metrics} loading={metricsLoading} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Recent Pages</h3>
                  {pagesLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}</div>
                  ) : pages.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">No pages yet. Create your first page to get started.</p>
                  ) : (
                    <div className="space-y-2">
                      {pages.slice(0, 6).map(p => (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm text-white truncate">{p.title}</span>
                            <span className="text-xs text-slate-500 truncate">/{p.slug}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${editorialStatusConfig[p.editorial_status || 'Draft']?.color || '#94A3B8'}15`, color: editorialStatusConfig[p.editorial_status || 'Draft']?.color || '#94A3B8' }}>
                            {editorialStatusConfig[p.editorial_status || 'Draft']?.label || 'Draft'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Collection Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Products', count: products.length, color: '#F97316' },
                      { label: 'Demos', count: demos.length, color: '#F59E0B' },
                      { label: 'Help Articles', count: helpArticles.length, color: '#06B6D4' },
                      { label: 'Partner Apps', count: partnerApplications.length, color: '#F59E0B' },
                      { label: 'Vacancies', count: careersVacancies.length, color: '#3B82F6' },
                      { label: 'Applications', count: careerApplications.length, color: '#8B5CF6' },
                      { label: 'Team Profiles', count: teamProfiles.length, color: '#06B6D4' },
                      { label: 'Services', count: services.length, color: '#06B6D4' },
                      { label: 'Staff', count: staff.length, color: '#7C3AED' },
                      { label: 'Case Studies', count: caseStudies.length, color: '#10B981' },
                      { label: 'Testimonials', count: testimonials.length, color: '#F59E0B' },
                      { label: 'FAQs', count: faqs.length, color: '#3B82F6' },
                      { label: 'Announcements', count: announcements.length, color: '#F97316' },
                      { label: 'Legal Docs', count: legal.length, color: '#EF4444' },
                      { label: 'Redirects', count: redirects.filter(r => r.active).length, color: '#8B5CF6' },
                    ].map(item => (
                      <div key={item.label} className="bg-[#0F172A] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-slate-400">{item.label}</span>
                        </div>
                        <p className="text-lg font-bold text-white">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PAGES */}
          {activeTab === 'pages' && (
            <motion.div key="pages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 flex items-center justify-center" />
                  <input
                    type="text" placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {statusFilters.map(sf => (
                    <button
                      key={sf.key}
                      onClick={() => setStatusFilter(sf.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === sf.key ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {pagesLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : filteredPages.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-file-text-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">{pages.length === 0 ? 'No pages yet. Pages will appear here when created.' : 'No pages match your filters.'}</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Page</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Slug</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">SEO</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Updated</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPages.map(p => {
                        const st = editorialStatusConfig[p.editorial_status || 'Draft'] || editorialStatusConfig['Draft'];
                        const hasSeo = p.seo_title && p.seo_description;
                        return (
                          <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-white">{p.title}</p>
                              {p.reference && <p className="text-[10px] text-slate-500 font-mono">{p.reference}</p>}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400 font-mono">/{p.slug}</td>
                            <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 capitalize">{p.page_type}</span></td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${st.color}15`, color: st.color }}>{st.label}</span>
                            </td>
                            <td className="px-5 py-3">{hasSeo ? <i className="ri-check-line w-4 h-4 text-emerald-400 flex items-center justify-center" /> : <i className="ri-close-line w-4 h-4 text-slate-600 flex items-center justify-center" />}</td>
                            <td className="px-5 py-3 text-xs text-slate-500">{new Date(p.updated_at).toLocaleDateString('en-GB')}</td>
                            <td className="px-5 py-3 text-right">
                              <select
                                value={p.editorial_status || 'Draft'}
                                onChange={e => handleStatusChange(p.id, e.target.value)}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer pr-8"
                              >
                                {['Draft', 'In Progress', 'Ready for Review', 'Approved', 'Scheduled', 'Published', 'Archived'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* NAVIGATION */}
          {activeTab === 'navigation' && (
            <motion.div key="nav" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {navLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : navItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-menu-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No navigation items. Add menu items to manage your site navigation.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Label</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Area</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Destination</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Order</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {navItems.map(item => (
                        <tr key={item.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-sm text-white">{item.label}</td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 capitalize">{item.area}</span></td>
                          <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{item.destination}</td>
                          <td className="px-5 py-3 text-xs text-slate-400 capitalize">{item.destination_type}</td>
                          <td className="px-5 py-3 text-sm text-slate-400">{item.sort_order}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleNavDelete(item.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center">
                              <i className="ri-delete-bin-line w-3.5 h-3.5 flex items-center justify-center" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* MEDIA */}
          {activeTab === 'media' && (
            <motion.div key="media" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {mediaLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : media.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-image-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No media assets. Upload images and files to use across your pages.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-5">
                    {media.map(m => (
                      <div key={m.id} className="bg-[#0F172A] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]">
                        <div className="aspect-square bg-white/5 flex items-center justify-center overflow-hidden">
                          {m.mime_type?.startsWith('image/') && m.public_url ? (
                            <Image src={m.public_url} alt={m.alt_text || m.file_name} width={240} height={240} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <i className="ri-file-3-line w-8 h-8 text-slate-600 flex items-center justify-center" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-slate-400 truncate">{m.file_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-500">{m.usage_count} uses</span>
                            <span className="text-[10px] text-slate-500">{m.classification}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {productsLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-stack-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No product records yet. Products created here will populate the public product directory.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Product</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Slug</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Category</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Visibility</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Featured</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">CTA</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const sc = productStatusConfig[p.product_status] || { label: p.product_status, color: '#94A3B8' };
                        return (
                          <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-white">{p.product_name}</p>
                              {(p.short_description || '').length > 0 && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{p.short_description}</p>}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{p.slug}</td>
                            <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{p.product_category || '-'}</span></td>
                            <td className="px-5 py-3">
                              <select
                                value={p.product_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('product_registry').update({ product_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', p.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchProducts(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {PRODUCT_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (productStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={p.public_visibility}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('product_registry').update({ public_visibility: e.target.value, updated_at: new Date().toISOString() }).eq('id', p.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Visibility updated', 'success'); refetchProducts(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs text-slate-300 cursor-pointer pr-8"
                              >
                                {PRODUCT_VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from('product_registry').update({ is_featured: !p.is_featured, updated_at: new Date().toISOString() }).eq('id', p.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast(p.is_featured ? 'Removed from featured' : 'Added to featured', 'success'); refetchProducts(); }
                                }}
                                className={`w-5 h-5 rounded cursor-pointer flex items-center justify-center ${p.is_featured ? 'text-[#06B6D4]' : 'text-slate-600'}`}
                              >
                                <i className={`${p.is_featured ? 'ri-star-fill' : 'ri-star-line'} w-4 h-4 flex items-center justify-center`} />
                              </button>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{p.primary_cta_type || '-'}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-external-link-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* DEMOS */}
          {activeTab === 'demos' && (
            <motion.div key="demos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-bold text-white">{demoMetricsLoading ? '-' : demoMetrics.total}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Public Demos</p>
                  <p className="text-xl font-bold text-emerald-400">{demoMetricsLoading ? '-' : demoMetrics.publicDemos}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Previews</p>
                  <p className="text-xl font-bold text-cyan-400">{demoMetricsLoading ? '-' : demoMetrics.publicPreviews}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Featured</p>
                  <p className="text-xl font-bold text-[#06B6D4]">{demoMetricsLoading ? '-' : demoMetrics.featured}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Coming Soon</p>
                  <p className="text-xl font-bold text-slate-400">{demoMetricsLoading ? '-' : demoMetrics.comingSoon}</p>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {demosLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : demos.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-slideshow-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No demo records yet. Create demos to populate the public Demo Centre.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Demo</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Slug</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Format</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Visibility</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Featured</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demos.map((d: DemoRegistry) => {
                        const fc = demoFormatConfig[d.demo_format] || { label: d.demo_format, icon: 'ri-information-line', color: '#94A3B8' };
                        const sc = demoStatusConfig[d.demo_status] || { label: d.demo_status, color: '#94A3B8' };
                        return (
                          <tr key={d.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-white">{d.demo_name}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{d.short_description || ''}</p>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{d.slug}</td>
                            <td className="px-5 py-3">
                              <select
                                value={d.demo_format}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('demo_registry').update({ demo_format: e.target.value, updated_at: new Date().toISOString() }).eq('id', d.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Format updated', 'success'); refetchDemos(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: fc.color }}
                              >
                                {DEMO_FORMATS.map(s => (
                                  <option key={s} value={s} style={{ color: (demoFormatConfig[s] || { color: '#94A3B8' }).color }}>{demoFormatConfig[s]?.label || s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={d.demo_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('demo_registry').update({ demo_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', d.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchDemos(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {DEMO_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (demoStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={d.public_visibility}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('demo_registry').update({ public_visibility: e.target.value, updated_at: new Date().toISOString() }).eq('id', d.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Visibility updated', 'success'); refetchDemos(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs text-slate-300 cursor-pointer pr-8"
                              >
                                {DEMO_VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from('demo_registry').update({ is_featured: !d.is_featured, updated_at: new Date().toISOString() }).eq('id', d.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast(d.is_featured ? 'Removed from featured' : 'Added to featured', 'success'); refetchDemos(); }
                                }}
                                className={`w-5 h-5 rounded cursor-pointer flex items-center justify-center ${d.is_featured ? 'text-[#06B6D4]' : 'text-slate-600'}`}
                              >
                                <i className={`${d.is_featured ? 'ri-star-fill' : 'ri-star-line'} w-4 h-4 flex items-center justify-center`} />
                              </button>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={`/demos/${d.slug}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-external-link-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* HELP ARTICLES */}
          {activeTab === 'help-articles' && (
            <motion.div key="help-articles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-bold text-white">{helpMetricsLoading ? '-' : helpMetrics.total}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Published</p>
                  <p className="text-xl font-bold text-emerald-400">{helpMetricsLoading ? '-' : helpMetrics.published}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Draft</p>
                  <p className="text-xl font-bold text-slate-400">{helpMetricsLoading ? '-' : helpMetrics.draft}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Featured</p>
                  <p className="text-xl font-bold text-[#06B6D4]">{helpMetricsLoading ? '-' : helpMetrics.featured}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Outdated</p>
                  <p className="text-xl font-bold text-orange-400">{helpMetricsLoading ? '-' : helpMetrics.outdated}</p>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {helpArticlesLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : helpArticles.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-question-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No help articles yet. Create articles to populate the public Help Centre.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Article</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Slug</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Category</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Visibility</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Featured</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {helpArticles.map((a: HelpArticle) => {
                        const sc = helpArticleStatusConfig[a.article_status] || { label: a.article_status, color: '#94A3B8' };
                        return (
                          <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-white">{a.title}</p>
                              {a.summary && <p className="text-[10px] text-slate-500 truncate max-w-[240px]">{a.summary}</p>}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{a.slug}</td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">
                                {a.category_label || helpCategoryConfig[a.category_id || '']?.label || a.category_id || '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={a.article_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('help_articles').update({ article_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', a.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchHelpArticles(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {HELP_ARTICLE_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (helpArticleStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={a.public_visibility}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('help_articles').update({ public_visibility: e.target.value, updated_at: new Date().toISOString() }).eq('id', a.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Visibility updated', 'success'); refetchHelpArticles(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs text-slate-300 cursor-pointer pr-8"
                              >
                                {HELP_ARTICLE_VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from('help_articles').update({ is_featured: !a.is_featured, updated_at: new Date().toISOString() }).eq('id', a.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast(a.is_featured ? 'Removed from featured' : 'Added to featured', 'success'); refetchHelpArticles(); }
                                }}
                                className={`w-5 h-5 rounded cursor-pointer flex items-center justify-center ${a.is_featured ? 'text-[#06B6D4]' : 'text-slate-600'}`}
                              >
                                <i className={`${a.is_featured ? 'ri-star-fill' : 'ri-star-line'} w-4 h-4 flex items-center justify-center`} />
                              </button>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={`/help/article/${a.slug}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-external-link-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* PARTNER APPLICATIONS */}
          {activeTab === 'partners' && (
            <motion.div key="partners" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-bold text-white">{partnerMetricsLoading ? '-' : partnerMetrics.total}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Submitted</p>
                  <p className="text-xl font-bold text-blue-400">{partnerMetricsLoading ? '-' : partnerMetrics.submitted}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Under Review</p>
                  <p className="text-xl font-bold text-amber-400">{partnerMetricsLoading ? '-' : partnerMetrics.underReview}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Approved</p>
                  <p className="text-xl font-bold text-emerald-400">{partnerMetricsLoading ? '-' : partnerMetrics.approved}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Pending</p>
                  <p className="text-xl font-bold text-slate-400">{partnerMetricsLoading ? '-' : partnerMetrics.pending}</p>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {partnerApplicationsLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : partnerApplications.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-briefcase-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No partner applications yet. Applications submitted via the public partner pages appear here.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Company</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Applicant</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Submitted</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerApplications.map((a: PartnerApplication) => {
                        const sc = partnerStatusConfig[a.status] || { label: a.status, color: '#94A3B8' };
                        return (
                          <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-white">{a.company_name}</p>
                              {a.website && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{a.website}</p>}
                            </td>
                            <td className="px-5 py-3">
                              <p className="text-sm text-slate-300">{a.applicant_name}</p>
                              <p className="text-[10px] text-slate-500">{a.email}</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 capitalize">
                                {a.application_type?.replace(/_/g, ' ') || '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={a.status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('partner_applications').update({ status: e.target.value, updated_at: new Date().toISOString() }).eq('id', a.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchPartnerApplications(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {PARTNER_APPLICATION_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (partnerStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={`mailto:${a.email}`} className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-mail-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* CAREERS */}
          {activeTab === 'careers' && (
            <motion.div key="careers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Vacancies</p>
                  <p className="text-xl font-bold text-white">{careersMetricsLoading ? '-' : careersMetrics.totalVacancies}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Open</p>
                  <p className="text-xl font-bold text-emerald-400">{careersMetricsLoading ? '-' : careersMetrics.openVacancies}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Applications</p>
                  <p className="text-xl font-bold text-purple-400">{careersMetricsLoading ? '-' : careersMetrics.totalApplications}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Submitted</p>
                  <p className="text-xl font-bold text-blue-400">{careersMetricsLoading ? '-' : careersMetrics.submittedApps}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Screening</p>
                  <p className="text-xl font-bold text-amber-400">{careersMetricsLoading ? '-' : careersMetrics.screeningApps}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Hired</p>
                  <p className="text-xl font-bold text-pink-400">{careersMetricsLoading ? '-' : careersMetrics.hired}</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Full Recruitment Management</h3>
                    <p className="text-xs text-slate-400">Manage vacancies, applications, pipeline, and hiring decisions in the dedicated recruitment area.</p>
                  </div>
                  <a
                    href="/admin/recruitment"
                    className="px-4 py-2 rounded-lg bg-[#06B6D4] text-white text-xs font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Open Recruitment
                    <i className="ri-arrow-right-line w-3.5 h-3.5 inline-flex items-center justify-center ml-1.5" />
                  </a>
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden mb-6">
                <h3 className="text-sm font-bold text-white px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">Recent Vacancies</h3>
                {careersVacanciesLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : careersVacancies.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">No vacancies yet.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Title</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Ref</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {careersVacancies.slice(0, 10).map((v: CareersVacancy) => {
                        const sc = vacancyStatusConfig[v.vacancy_status] || { label: v.vacancy_status, color: '#94A3B8' };
                        return (
                          <tr key={v.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3 text-sm font-medium text-white">{v.title}</td>
                            <td className="px-5 py-3 text-xs text-slate-400 font-mono">{v.reference || '-'}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{employmentTypeConfig[v.employment_type]?.label || v.employment_type}</td>
                            <td className="px-5 py-3">
                              <select
                                value={v.vacancy_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('careers_vacancies').update({ vacancy_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', v.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchCareersVacancies(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {VACANCY_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (vacancyStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <a href={`/careers/${v.slug}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer inline-flex items-center justify-center">
                                <i className="ri-external-link-line w-3.5 h-3.5 flex items-center justify-center" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                <h3 className="text-sm font-bold text-white px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">Recent Applications</h3>
                {careerApplicationsLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : careerApplications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">No applications yet.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Candidate</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Submitted</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {careerApplications.slice(0, 10).map((a: CareerApplication) => {
                        const sc = applicationStatusConfig[a.application_status] || { label: a.application_status, color: '#94A3B8' };
                        return (
                          <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3 text-sm font-medium text-white">{a.candidate_name}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{a.candidate_email}</td>
                            <td className="px-5 py-3">
                              <select
                                value={a.application_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('career_applications').update({ application_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', a.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchCareerApplications(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {['Submitted', 'Screening', 'Shortlist review', 'Interview proposed', 'Interview scheduled', 'Assessment', 'References', 'Offer preparation', 'Offer made', 'Hired', 'Not progressing', 'Withdrawn', 'On hold', 'Archived'].map(s => (
                                  <option key={s} value={s} style={{ color: (applicationStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <a href={`mailto:${a.candidate_email}`} className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer inline-flex items-center justify-center">
                                <i className="ri-mail-line w-3.5 h-3.5 flex items-center justify-center" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* TEAM PROFILES */}
          {activeTab === 'team-profiles' && (
            <motion.div key="team-profiles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-bold text-white">{teamMetricsLoading ? '-' : teamMetrics.total}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Published</p>
                  <p className="text-xl font-bold text-emerald-400">{teamMetricsLoading ? '-' : teamMetrics.published}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Draft</p>
                  <p className="text-xl font-bold text-slate-400">{teamMetricsLoading ? '-' : teamMetrics.draft}</p>
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Featured</p>
                  <p className="text-xl font-bold text-[#06B6D4]">{teamMetricsLoading ? '-' : teamMetrics.featured}</p>
                </div>
              </div>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {teamProfilesLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : teamProfiles.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-user-star-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No team profiles yet. Create profiles to populate the public team directory.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Slug</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Department</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Role</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Featured</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Order</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamProfiles.map((p: PublicTeamProfile) => {
                        const sc = teamProfileStatusConfig[p.public_status] || { label: p.public_status, color: '#94A3B8' };
                        return (
                          <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {p.profile_asset_id ? (
                                  <Image src={p.profile_asset_id} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover" unoptimized />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-500">
                                      {p.public_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm font-medium text-white">{p.public_name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{p.slug}</td>
                            <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{p.department || '-'}</span></td>
                            <td className="px-5 py-3 text-sm text-slate-400 max-w-[160px] truncate">{p.public_job_title || '-'}</td>
                            <td className="px-5 py-3">
                              <select
                                value={p.public_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('public_team_profiles').update({ public_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', p.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchTeamProfiles(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {TEAM_PROFILE_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (teamProfileStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from('public_team_profiles').update({ featured: !p.featured, updated_at: new Date().toISOString() }).eq('id', p.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast(p.featured ? 'Removed from featured' : 'Added to featured', 'success'); refetchTeamProfiles(); }
                                }}
                                className={`w-5 h-5 rounded cursor-pointer flex items-center justify-center ${p.featured ? 'text-[#06B6D4]' : 'text-slate-600'}`}
                              >
                                <i className={`${p.featured ? 'ri-star-fill' : 'ri-star-line'} w-4 h-4 flex items-center justify-center`} />
                              </button>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400">{p.display_order}</td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={`/team/${p.slug}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-external-link-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* COLLECTIONS (Services, Staff, Case Studies, Testimonials, FAQs, Announcements, Legal) */}
          {['services', 'staff', 'case-studies', 'testimonials', 'faqs', 'announcements', 'legal'].includes(activeTab) && (
            <motion.div key="collections" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <CollectionTable
                type={activeTab}
                services={activeTab === 'services' ? services : []} servicesLoading={servicesLoading}
                staff={activeTab === 'staff' ? staff : []} staffLoading={staffLoading}
                caseStudies={activeTab === 'case-studies' ? caseStudies : []} csLoading={csLoading}
                testimonials={activeTab === 'testimonials' ? testimonials : []} tmLoading={tmLoading}
                faqs={activeTab === 'faqs' ? faqs : []} faqsLoading={faqsLoading}
                announcements={activeTab === 'announcements' ? announcements : []} annLoading={annLoading}
                legal={activeTab === 'legal' ? legal : []} legalLoading={legalLoading}
              />
            </motion.div>
          )}

          {/* REDIRECTS */}
          {activeTab === 'redirects' && (
            <motion.div key="redirects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {redirLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : redirects.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-share-forward-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No redirects configured. Add redirects when changing URLs or restructuring pages.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">From</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">To</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Active</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Last Tested</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirects.map(r => (
                        <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-sm text-slate-300 font-mono">{r.source_path}</td>
                          <td className="px-5 py-3 text-sm text-slate-400 font-mono">{r.destination_path}</td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{r.redirect_type}</span></td>
                          <td className="px-5 py-3">{r.active ? <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> : <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{r.test_status || 'Not tested'}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleRedirectDelete(r.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center">
                              <i className="ri-delete-bin-line w-3.5 h-3.5 flex items-center justify-center" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* FOOTER */}
          {activeTab === 'footer' && (
            <motion.div key="footer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
                <i className="ri-layout-bottom-line w-12 h-12 text-slate-600 mx-auto mb-4 flex items-center justify-center" />
                <h3 className="text-lg font-bold text-white mb-2">Footer Configuration</h3>
                <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
                  The footer is managed through the{' '}
                  <code className="px-2 py-0.5 rounded bg-white/5 text-[#06B6D4] text-xs">cms_footer</code>{' '}
                  table and the{' '}
                  <code className="px-2 py-0.5 rounded bg-white/5 text-[#06B6D4] text-xs">cms_navigation</code>{' '}
                  table (area=&quot;footer&quot;). Footer records include company name, contact details, social links and copyright text. Navigation items with area=&quot;footer&quot; render as footer links.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${
                toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}

function isCmsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readCmsString(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  return typeof value === 'string' ? value : '';
}

function readCmsDisplayValue(item: Record<string, unknown>, key: string): string | number | null {
  const value = item[key];
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function CollectionTable({
  type, services, servicesLoading, staff, staffLoading, caseStudies, csLoading,
  testimonials, tmLoading, faqs, faqsLoading, announcements, annLoading, legal, legalLoading,
}: {
  type: string;
  services: CmsService[]; servicesLoading: boolean;
  staff: CmsStaff[]; staffLoading: boolean;
  caseStudies: CmsCaseStudy[]; csLoading: boolean;
  testimonials: CmsTestimonial[]; tmLoading: boolean;
  faqs: CmsFaq[]; faqsLoading: boolean;
  announcements: CmsAnnouncement[]; annLoading: boolean;
  legal: CmsLegal[]; legalLoading: boolean;
}) {
  const data = type === 'services' ? { items: services, loading: servicesLoading, label: 'Services' }
    : type === 'staff' ? { items: staff, loading: staffLoading, label: 'Staff' }
    : type === 'case-studies' ? { items: caseStudies, loading: csLoading, label: 'Case Studies' }
    : type === 'testimonials' ? { items: testimonials, loading: tmLoading, label: 'Testimonials' }
    : type === 'faqs' ? { items: faqs, loading: faqsLoading, label: 'FAQs' }
    : type === 'announcements' ? { items: announcements, loading: annLoading, label: 'Announcements' }
    : { items: legal, loading: legalLoading, label: 'Legal Documents' };

  if (data.loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
        <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
        <i className="ri-inbox-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
        <p className="text-slate-400 text-sm">No {data.label.toLowerCase()} yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">
              {type === 'faqs' ? 'Question' : type === 'testimonials' ? 'Source' : type === 'announcements' ? 'Title' : type === 'legal' ? 'Document' : 'Name'}
            </th>
            {type === 'services' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Slug</th>}
            {type === 'staff' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Role</th>}
            {type === 'case-studies' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Industry</th>}
            {type === 'testimonials' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Company</th>}
            {type === 'faqs' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Category</th>}
            {type === 'announcements' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Style</th>}
            {type === 'legal' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Version</th>}
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
            {type !== 'faqs' && type !== 'testimonials' && <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Order</th>}
          </tr>
        </thead>
        <tbody>
          {(data.items as unknown[]).map((item) => {
            if (!isCmsRecord(item)) return null;

            const id = readCmsString(item, 'id');
            const status = readCmsString(item, 'status') || 'Draft';
            const order = readCmsDisplayValue(item, 'sort_order') ?? readCmsDisplayValue(item, 'display_order') ?? '-';

            return (
            <tr key={id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
              <td className="px-5 py-3 text-sm text-white">
                {type === 'faqs' ? <span className="line-clamp-2">{readCmsString(item, 'question')}</span>
                  : type === 'testimonials' ? readCmsString(item, 'source_name')
                  : type === 'legal' ? readCmsString(item, 'title')
                  : readCmsString(item, 'name') || readCmsString(item, 'title')}
              </td>
              {type === 'services' && <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{readCmsString(item, 'slug')}</td>}
              {type === 'staff' && <td className="px-5 py-3 text-sm text-slate-400">{readCmsString(item, 'role') || '-'}</td>}
              {type === 'case-studies' && <td className="px-5 py-3 text-sm text-slate-400">{readCmsString(item, 'industry') || '-'}</td>}
              {type === 'testimonials' && <td className="px-5 py-3 text-sm text-slate-400">{readCmsString(item, 'role_company') || '-'}</td>}
              {type === 'faqs' && <td className="px-5 py-3 text-sm text-slate-400">{readCmsString(item, 'category') || '-'}</td>}
              {type === 'announcements' && <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{readCmsString(item, 'style')}</span></td>}
              {type === 'legal' && <td className="px-5 py-3 text-sm text-slate-400">v{readCmsDisplayValue(item, 'version')}</td>}
              <td className="px-5 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  status === 'Published' || status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-500/10 text-slate-400'
                }`}>{status}</span>
              </td>
              {type !== 'faqs' && type !== 'testimonials' && (
                <td className="px-5 py-3 text-sm text-slate-400">{order}</td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
