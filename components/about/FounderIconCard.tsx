import { motion } from '@/components/motion';

interface FounderIconCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
  color?: string;
}

export default function FounderIconCard({ icon, title, description, delay = 0, color = '#06B6D4' }: FounderIconCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-300"
        style={{ backgroundColor: `${color}15` }}
      >
        <i className={`${icon} text-base w-4 h-4 flex items-center justify-center`} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5 group-hover:text-[#06B6D4] transition-colors duration-300">
          {title}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}