'use client';

import { motion } from '@/components/motion';

interface TeamCardProps {
  name: string;
  role: string;
  bio: string;
  skills: string[];
  imageUrl: string;
  accentColor: string;
  index: number;
}

export default function TeamCard({ name, role, bio, skills, imageUrl, accentColor, index }: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-2xl p-5 group flex flex-col"
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors duration-300"
          style={{ borderColor: `${accentColor}30` }}
        >
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-white text-base leading-tight">{name}</h4>
          <p className="text-xs font-medium mt-0.5" style={{ color: accentColor }}>{role}</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">{bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors duration-300"
            style={{ backgroundColor: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}20` }}
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
}