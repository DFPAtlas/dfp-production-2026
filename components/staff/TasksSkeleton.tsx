'use client';

export default function TasksSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-white/10 rounded-lg" />
          <div className="h-4 w-64 bg-white/5 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-white/10 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-20 bg-white/5 rounded-lg" />
              <div className="w-9 h-9 bg-white/10 rounded-xl" />
            </div>
            <div className="h-8 w-12 bg-white/10 rounded-lg mb-2" />
            <div className="h-3 w-28 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="h-10 w-48 bg-white/5 rounded-xl flex-1 min-w-[200px]" />
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="h-4 w-24 bg-white/10 rounded-lg" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-[rgba(255,255,255,0.04)] flex items-center gap-4">
            <div className="w-5 h-5 bg-white/10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
              <div className="h-3 w-1/2 bg-white/5 rounded-lg" />
            </div>
            <div className="h-6 w-20 bg-white/5 rounded-lg" />
            <div className="h-6 w-16 bg-white/5 rounded-lg" />
            <div className="h-4 w-16 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}