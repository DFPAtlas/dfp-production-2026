'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import Link from 'next/link';

export interface PublicTeamProfile {
  id: string;
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
}

export default function TeamProfileDetail({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<PublicTeamProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('public_team_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('public_status', 'Published')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setProfile(data as PublicTeamProfile);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <i className="ri-user-search-line text-3xl text-slate-300 w-8 h-8 flex items-center justify-center" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile not found</h2>
        <p className="text-slate-500 mb-6">This team member profile is not available or has not been published yet.</p>
        <Link href="/team" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors whitespace-nowrap cursor-pointer">
          View all team members
        </Link>
      </div>
    );
  }

  const initials = profile.public_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const areas = profile.specialist_areas || [];
  const resp = profile.responsibilities || [];
  const quals = profile.qualifications || [];
  const links = profile.professional_links || {};

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <Link href="/team" className="inline-flex items-center gap-1.5 text-sm text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer mb-6">
          <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
          Back to team
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-2/5 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 p-8 lg:p-10 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(6,182,212,0.08),transparent)]" />
              <div className="relative z-10">
                {profile.profile_asset_id ? (
                  <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-[#06B6D4]/20 mb-5 shadow-[0_0_40px_rgba(6,182,212,0.08)]">
                    <img
                      src={profile.profile_asset_id}
                      alt={profile.image_alt_text || profile.public_name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[#06B6D4]/10 to-[#8B5CF6]/10 border-2 border-[#06B6D4]/20 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(6,182,212,0.08)]">
                    <span className="text-3xl font-bold text-[#06B6D4]/60">{initials}</span>
                  </div>
                )}
                <h1 className="text-2xl font-bold text-slate-900 text-center">{profile.public_name}</h1>
                {profile.public_job_title && (
                  <p className="text-[#06B6D4] font-medium text-sm mt-1 text-center">{profile.public_job_title}</p>
                )}
                {profile.department && (
                  <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium bg-[#06B6D4]/8 text-[#06B6D4] border border-[#06B6D4]/15">
                    {profile.department}
                  </span>
                )}
                {profile.leadership_level && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/8 text-purple-600 border border-purple-500/15">
                    {profile.leadership_level}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:w-3/5 p-8 lg:p-10">
              {profile.short_bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">About</h3>
                  <p className="text-slate-600 leading-relaxed">{profile.short_bio}</p>
                </div>
              )}

              {profile.full_bio && (
                <div className="mb-6">
                  <p className="text-slate-600 leading-relaxed">{profile.full_bio}</p>
                </div>
              )}

              {areas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Specialist Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {areas.map((area, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#06B6D4]/6 text-[#06B6D4] border border-[#06B6D4]/10">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resp.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Responsibilities</h3>
                  <ul className="space-y-2">
                    {resp.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <i className="ri-check-line text-[#06B6D4] mt-0.5 w-4 h-4 flex items-center justify-center shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {quals.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Qualifications</h3>
                  <ul className="space-y-2">
                    {quals.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <i className="ri-award-line text-[#06B6D4] mt-0.5 w-4 h-4 flex items-center justify-center shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Object.keys(links).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Professional Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-colors cursor-pointer"
                      >
                        <i className={`ri-${platform === 'linkedin' ? 'linkedin' : 'links'}-line w-4 h-4 flex items-center justify-center`} />
                        <span className="capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="text-center pt-8 border-t border-slate-100">
        <p className="text-slate-500 text-sm mb-4">Interested in working with our team?</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-mail-send-line w-4 h-4 flex items-center justify-center" />
          Contact Digital Footprint
        </Link>
      </div>
    </div>
  );
}