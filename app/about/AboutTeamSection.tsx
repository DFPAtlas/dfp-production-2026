'use client';

import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TeamPreview {
  id: string;
  public_name: string;
  slug: string;
  public_job_title: string | null;
  department: string | null;
  short_bio: string | null;
  profile_asset_id: string | null;
  image_alt_text: string | null;
  specialist_areas: string[] | null;
  featured: boolean;
}

export default function AboutTeamSection() {
  const [leaders, setLeaders] = useState<TeamPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('public_team_profiles')
      .select('id,public_name,slug,public_job_title,department,short_bio,profile_asset_id,image_alt_text,specialist_areas,featured')
      .eq('public_status', 'Published')
      .order('display_order')
      .limit(4)
      .then(({ data }) => {
        if (!cancelled) {
          setLeaders((data || []) as TeamPreview[]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-6 section-dark-alt relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.03),transparent_70%)]" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
              <i className="ri-team-line w-4 h-4 flex items-center justify-center" />
              Leadership
            </div>
            <div className="h-9 w-80 mx-auto skeleton rounded-lg mb-3" />
            <div className="h-5 w-96 mx-auto skeleton rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card rounded-2xl p-6 text-center">
                <div className="w-20 h-20 rounded-2xl skeleton mx-auto mb-4" />
                <div className="h-5 w-24 skeleton rounded mx-auto mb-1" />
                <div className="h-4 w-32 skeleton rounded mx-auto mb-3" />
                <div className="h-3 w-full skeleton rounded mb-1" />
                <div className="h-3 w-3/4 skeleton rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (leaders.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-6 section-dark-alt relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.03),transparent_70%)]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-team-line w-4 h-4 flex items-center justify-center" />
            Leadership
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">The People Behind the Technology</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">A small, senior team of specialists — not a sprawling agency where you get lost in the crowd.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {leaders.map((leader, index) => {
            const initials = leader.public_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const areas = (leader.specialist_areas || []).slice(0, 2);

            return (
              <Link key={leader.id} href={`/team/${leader.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="glass-card rounded-2xl p-6 text-center group cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  {leader.profile_asset_id ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border-2 border-[#06B6D4]/20 group-hover:border-[#06B6D4]/40 transition-colors">
                      <img
                        src={leader.profile_asset_id}
                        alt={leader.image_alt_text || leader.public_name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#06B6D4]/6 flex items-center justify-center mx-auto mb-4 border border-[#06B6D4]/15 group-hover:border-[#06B6D4]/30 transition-colors">
                      <span className="text-xl font-bold text-[#06B6D4]/60">{initials}</span>
                    </div>
                  )}
                  <h4 className="font-bold text-slate-800 text-lg mb-0.5">{leader.public_name}</h4>
                  {leader.public_job_title && (
                    <p className="text-xs text-[#06B6D4] font-medium mb-2">{leader.public_job_title}</p>
                  )}
                  {leader.short_bio && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{leader.short_bio}</p>
                  )}
                  {areas.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
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
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/team"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] font-semibold text-sm hover:bg-[#06B6D4]/12 transition-colors cursor-pointer"
          >
            View the full team
            <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}