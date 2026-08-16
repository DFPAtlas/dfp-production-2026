'use client';

export default function ProjectDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="w-32 h-4 bg-white/5 rounded mb-3" />
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="w-64 h-7 bg-white/5 rounded mb-2" />
            <div className="w-40 h-4 bg-white/5 rounded" />
          </div>
          <div className="w-32 h-9 bg-white/5 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
            <div className="w-20 h-3 bg-white/5 rounded mb-3" />
            <div className="w-14 h-8 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-1.5 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-24 h-9 bg-white/5 rounded-xl" />
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="w-40 h-5 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-4 bg-white/5 rounded" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}