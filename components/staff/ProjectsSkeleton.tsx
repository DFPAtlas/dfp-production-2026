'use client';

export default function ProjectsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-40 bg-white/5 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>
        <div className="h-10 w-36 bg-white/5 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 bg-white/5 rounded" />
              <div className="w-9 h-9 rounded-xl bg-white/5" />
            </div>
            <div className="h-8 w-12 bg-white/5 rounded mb-2" />
            <div className="h-3 w-28 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 h-10 bg-white/5 rounded-xl" />
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-28 bg-white/5 rounded-xl" />)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-white/5 rounded" />
              <div className="h-5 w-16 bg-white/5 rounded-lg" />
            </div>
            <div className="h-3 w-24 bg-white/5 rounded" />
            <div className="h-1.5 w-full bg-white/5 rounded-full" />
            <div className="h-3 w-32 bg-white/5 rounded" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-3 w-20 bg-white/5 rounded" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}