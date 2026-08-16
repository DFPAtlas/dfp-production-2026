'use client';

export default function LeadsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 animate-pulse">
        <div className="h-7 bg-white/5 rounded w-24 mb-2" />
        <div className="h-4 bg-white/5 rounded w-64" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 animate-pulse">
            <div className="h-3 bg-white/5 rounded w-16 mb-2" />
            <div className="h-7 bg-white/5 rounded w-12" />
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] animate-pulse">
          <div className="flex gap-3">
            <div className="flex-1 h-10 bg-white/5 rounded-xl" />
            <div className="h-10 w-32 bg-white/5 rounded-xl" />
            <div className="h-10 w-24 bg-white/5 rounded-xl" />
          </div>
        </div>
        <div className="animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                <div>
                  <div className="h-4 bg-white/5 rounded w-28 mb-1" />
                  <div className="h-3 bg-white/5 rounded w-40" />
                </div>
              </div>
              <div className="h-4 bg-white/5 rounded w-24 hidden sm:block" />
              <div className="h-4 bg-white/5 rounded w-20 hidden md:block" />
              <div className="h-6 bg-white/5 rounded-lg w-16" />
              <div className="h-6 bg-white/5 rounded-lg w-20 hidden lg:block" />
              <div className="h-4 bg-white/5 rounded w-16 hidden md:block" />
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-white/5 rounded-lg" />
                <div className="w-8 h-8 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}