'use client';

import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import FounderIconCard from '@/components/about/FounderIconCard';



const TRANSLATOR_CARDS = [
  {
    icon: 'ri-chat-1-line',
    title: 'Client Language',
    description: 'Understanding what the client actually wants and needs',
    color: '#06B6D4',
  },
  {
    icon: 'ri-compasses-2-line',
    title: 'Technical Direction',
    description: 'Turning ideas into clear build instructions for the team',
    color: '#8B5CF6',
  },
  {
    icon: 'ri-trophy-line',
    title: 'Business Outcome',
    description: 'Making sure the finished system solves the real problem',
    color: '#10B981',
  },
];

const FALLBACK_FOUNDER = {
  name: 'Martin Hewett',
  role: 'Founder / Full Stack Developer / Project Conductor / Technology Translator',
  bio: 'Martin is the founder of Digital Footprint and works as the conductor between the client, designers, developers, testers, freelancers, AI tools, cloud systems, and support teams. His role is to keep the project moving, translate the client\'s idea into clear technical direction, and make sure every part of the CDD process connects properly from first concept to live deployment.',
  bio_paragraph_2: 'Martin does more than build systems. He helps translate the technical world into normal, clear language for clients. Many clients do not need to understand every database, server, API, automation, cloud function, AI model, or background process that makes a system work. They just need to know what it does, why it matters, and how it helps their business. This is where Martin\'s years of experience come in. He works between the client and the technical teams, turning ideas, problems, and business goals into clear technical direction. He explains complex technology in a way that makes sense, helps clients make better decisions, and makes sure nothing important gets lost between the idea, the design, the development, and the final deployment.',
  image_url: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20of%20a%20British%20male%20tech%20founder%20in%20his%2040s%20wearing%20a%20smart%20casual%20navy%20blazer%20confident%20friendly%20expression%20modern%20clean%20studio%20background%20with%20subtle%20gradient%20soft%20professional%20lighting%20portrait%20photography%20style%20high%20quality%20sharp%20focus&width=320&height=320&seq=202&orientation=squarish',
  skills: ['Full Stack Development', 'UI / UX Design', 'Cloud Architecture', 'AI & Automation', 'Business Strategy', 'Project Management'],
};

export default function FounderSection() {
  const [founder, setFounder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (mountedRef.current) {
        setFounder(FALLBACK_FOUNDER);
        setLoading(false);
      }
    }, 8000);

    if (!supabase) {
      return;
    }

    const promise = supabase.from('about_founder').select('*').maybeSingle();
    void Promise.resolve(promise).then(({ data }) => {
      if (!mountedRef.current) return;
      if (!timedOut) {
        clearTimeout(timeoutId);
      }
      if (data) {
        setFounder(data);
      } else if (!timedOut) {
        setFounder(FALLBACK_FOUNDER);
      }
      setLoading(false);
    }).catch(() => {
      if (!mountedRef.current) return;
      if (!timedOut) {
        clearTimeout(timeoutId);
        setFounder(FALLBACK_FOUNDER);
      }
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <section id="founder-section" className="py-24 px-6 section-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(6,182,212,0.04),transparent_60%)]" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
              <i className="ri-user-star-line w-4 h-4 flex items-center justify-center" />
              Meet the Founder
            </div>
            <div className="h-10 w-80 mx-auto skeleton rounded-lg mb-3" />
            <div className="h-5 w-64 mx-auto skeleton rounded-md" />
          </div>
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 p-8 lg:p-10 flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-32 h-32 rounded-2xl skeleton mb-6" />
                <div className="h-8 w-40 skeleton rounded-lg mb-2" />
                <div className="h-4 w-48 skeleton rounded-md" />
              </div>
              <div className="lg:w-3/5 p-8 lg:p-10">
                <div className="h-5 w-40 skeleton rounded-md mb-6" />
                <div className="space-y-3 mb-4">
                  <div className="h-4 w-full skeleton rounded-md" />
                  <div className="h-4 w-full skeleton rounded-md" />
                  <div className="h-4 w-3/4 skeleton rounded-md" />
                </div>
                <div className="space-y-3 mb-4">
                  <div className="h-4 w-full skeleton rounded-md" />
                  <div className="h-4 w-5/6 skeleton rounded-md" />
                  <div className="h-4 w-2/3 skeleton rounded-md" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-8 skeleton rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const display = founder || FALLBACK_FOUNDER;
  const skillsArray = Array.isArray(display.skills) ? display.skills : [];

  return (
    <section id="founder-section" className="py-24 px-6 section-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(6,182,212,0.04),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-user-star-line w-4 h-4 flex items-center justify-center" />
            Meet the Founder
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
            The Conductor Behind Every Project
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
            One person who connects every stage of your project — from the first conversation to the final deployment.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-2/5 relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(6,182,212,0.1),transparent)]" />
              <div className="relative z-10 p-8 lg:p-10 flex flex-col items-center justify-center h-full min-h-[320px]">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-[#06B6D4]/30 mb-6 shadow-[0_0_40px_rgba(6,182,212,0.12)]">
                  <img
                    src={display.image_url}
                    alt={display.name}
                    className="w-full h-full object-cover object-top"
                    decoding="async"
                    width={128}
                    height={128}
                  />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 text-center">{display.name}</h3>
                <p className="text-[#06B6D4] font-medium text-sm mt-1 text-center leading-relaxed max-w-[240px]">
                  {display.role}
                </p>
              </div>
            </div>

            <div className="lg:w-3/5 p-8 lg:p-10 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center">
                  <i className="ri-megaphone-line text-xl text-[#06B6D4] w-5 h-5 flex items-center justify-center" />
                </div>
                <span className="text-sm font-semibold text-[#06B6D4] uppercase tracking-wider">The Project Conductor</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-slate-600 leading-relaxed text-base mb-4"
              >
                {display.bio}
              </motion.p>

              {display.bio_paragraph_2 && (
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-slate-600 leading-relaxed text-base mb-4"
                >
                  {display.bio_paragraph_2}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#06B6D4]/8 to-[#8B5CF6]/8 border border-[#06B6D4]/15 mb-6"
              >
                <i className="ri-sparkling-line text-sm text-[#06B6D4] w-4 h-4 flex items-center justify-center" />
                <span className="text-sm font-semibold bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] bg-clip-text text-transparent">
                  Translating technology into real business outcomes
                </span>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {TRANSLATOR_CARDS.map((card, i) => (
                  <FounderIconCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    description={card.description}
                    color={card.color}
                    delay={0.58 + i * 0.08}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {skillsArray.map((skill: string, i: number) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.06 }}
                    className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#06B6D4]/8 text-[#06B6D4] border border-[#06B6D4]/15 text-center"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}