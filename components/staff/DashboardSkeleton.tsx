'use client';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/10 rounded-lg" />
          <div className="h-4 w-48 bg-white/5 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-white/10 rounded-xl" />
          <div className="h-10 w-32 bg-white/5 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-20 bg-white/5 rounded-lg" />
              <div className="w-10 h-10 bg-white/10 rounded-xl" />
            </div>
            <div className="h-8 w-16 bg-white/10 rounded-lg mb-3" />
            <div className="h-3 w-32 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <div className="h-6 w-44 bg-white/10 rounded-lg mb-5" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <div className="h-6 w-36 bg-white/10 rounded-lg mb-5" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full bg-white/5 rounded-lg" />
                <div className="h-2 w-full bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <div className="h-6 w-32 bg-white/10 rounded-lg mb-5" />
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-10 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}