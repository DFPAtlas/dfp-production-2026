'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface TeamProfile {
  id: string;
  public_name: string;
  slug: string;
  public_job_title: string | null;
  department: string | null;
  leadership_level: string | null;
  short_bio: string | null;
  specialist_areas: string[] | null;
  profile_asset_id: string | null;
  image_alt_text: string | null;
  display_order: number;
  featured: boolean;
}

const DEPARTMENTS = [
  'Leadership',
  'Product and Strategy',
  'UI Development',
  'UX Development',
  'Software Engineering',
  'AI and Automation',
  'Client Delivery',
  'Quality Assurance',
  'Support',
  'Sales and Partnerships',
  'Operations',
];

export default function TeamPage() {
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('public_team_profiles')
      .select('id,public_name,slug,public_job_title,department,leadership_level,short_bio,specialist_areas,profile_asset_id,image_alt_text,display_order,featured')
      .eq('public_status', 'Published')
      .order('display_order')
      .then(({ data }) => {
        if (!cancelled) {
          setProfiles((data || []) as TeamProfile[]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const activeDepts = [...new Set(profiles.map(p => p.department).filter(Boolean))] as string[];
  const filteredProfiles = deptFilter === 'all'
    ? profiles
    : profiles.filter(p => p.department === deptFilter);

  const featured = filteredProfiles.filter(p => p.featured);
  const rest = filteredProfiles.filter(p => !p.featured);
  const sortedProfiles = [...featured, ...rest];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fafbfc]">
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
                <i className="ri-team-line w-4 h-4 flex items-center justify-center" />
                Meet the Team
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
                The People Behind Digital Footprint
              </h1>
              <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
                A small, senior team of specialists — not a sprawling agency where you get lost in the crowd.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 mx-auto mb-4" />
                    <div className="h-5 w-32 bg-slate-100 rounded mx-auto mb-2" />
                    <div className="h-4 w-24 bg-slate-100 rounded mx-auto mb-3" />
                    <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-3/4 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-team-line text-3xl text-slate-300 w-8 h-8 flex items-center justify-center" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Team profiles coming soon</h2>
                <p className="text-slate-500 mb-6">We&apos;re preparing our team profiles. Check back shortly.</p>
                <Link href="/contact" className="inline-flex px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors whitespace-nowrap cursor-pointer">
                  Get in touch
                </Link>
              </div>
            ) : (
              <>
                {activeDepts.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-10">
                    <button
                      onClick={() => setDeptFilter('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        deptFilter === 'all'
                          ? 'bg-[#06B6D4] text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-[#06B6D4]/30'
                      }`}
                    >
                      All
                    </button>
                    {DEPARTMENTS.filter(d => activeDepts.includes(d)).map(dept => (
                      <button
                        key={dept}
                        onClick={() => setDeptFilter(dept)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                          deptFilter === dept
                            ? 'bg-[#06B6D4] text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-[#06B6D4]/30'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}

                {featured.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <i className="ri-star-fill text-[#06B6D4] w-4 h-4 flex items-center justify-center" />
                      <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Leadership</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {featured.map(p => (
                        <TeamCard key={p.id} profile={p} featured />
                      ))}
                    </div>
                  </motion.div>
                )}

                {rest.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {featured.length > 0 && (
                      <div className="flex items-center gap-2 mb-5">
                        <i className="ri-user-star-line text-slate-400 w-4 h-4 flex items-center justify-center" />
                        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Team Members</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {rest.map(p => (
                        <TeamCard key={p.id} profile={p} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {filteredProfiles.length === 0 && deptFilter !== 'all' && (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No team members found in this department.</p>
                    <button
                      onClick={() => setDeptFilter('all')}
                      className="mt-3 text-[#06B6D4] text-sm font-medium hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="py-16 px-6 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Want to join the team?</h3>
            <p className="text-slate-500 mb-6">
              We&apos;re always looking for talented people who care about building great digital products. If you think you&apos;d be a good fit, we&apos;d love to hear from you.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-mail-send-line w-4 h-4 flex items-center justify-center" />
              Get in touch
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function TeamCard({ profile, featured }: { profile: TeamProfile; featured?: boolean }) {
  const initials = profile.public_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const areas = (profile.specialist_areas || []).slice(0, 3);

  return (
    <Link href={`/team/${profile.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={`bg-white rounded-2xl border p-6 text-center transition-all duration-300 cursor-pointer h-full ${
          featured
            ? 'border-[#06B6D4]/20 hover:border-[#06B6D4]/40 shadow-[0_0_30px_rgba(6,182,212,0.06)]'
            : 'border-slate-200 hover:border-[#06B6D4]/20 hover:shadow-sm'
        }`}
      >
        {featured && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/15 text-[#06B6D4] text-xs font-medium mb-4">
            <i className="ri-star-fill w-3 h-3 flex items-center justify-center" />
            Leadership
          </div>
        )}
        {profile.profile_asset_id ? (
          <div className={`w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border-2 ${featured ? 'border-[#06B6D4]/20' : 'border-slate-200'}`}>
            <img
              src={profile.profile_asset_id}
              alt={profile.image_alt_text || profile.public_name}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center border-2 ${
            featured
              ? 'border-[#06B6D4]/20 bg-gradient-to-br from-[#06B6D4]/8 to-[#8B5CF6]/8'
              : 'border-slate-200 bg-slate-50'
          }`}>
            <span className={`text-xl font-bold ${featured ? 'text-[#06B6D4]/60' : 'text-slate-400'}`}>{initials}</span>
          </div>
        )}
        <h3 className="font-bold text-slate-900 text-lg mb-0.5">{profile.public_name}</h3>
        {profile.public_job_title && (
          <p className="text-[#06B6D4] text-sm font-medium mb-2">{profile.public_job_title}</p>
        )}
        {profile.department && (
          <p className="text-xs text-slate-400 mb-3">{profile.department}</p>
        )}
        {profile.short_bio && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{profile.short_bio}</p>
        )}
        {areas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {areas.map((area, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                {area}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </Link>
  );
}