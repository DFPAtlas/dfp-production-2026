import Link from 'next/link';

export default function BespokeCallout() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.6)] backdrop-blur-sm p-8 md:p-10 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 opacity-30 pointer-events-none" aria-hidden="true">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#38E8C6]" />
            <div className="absolute left-10 top-1/3 w-1.5 h-1.5 rounded-full bg-[#8B6CFF]" />
            <div className="absolute left-14 top-2/3 w-1.5 h-1.5 rounded-full bg-[#38E8C6]" />
            <div className="absolute left-20 top-1/2 w-1 h-1 rounded-full bg-[#8B6CFF]" />
            <svg className="absolute left-6 top-0 w-full h-full" style={{ overflow: 'visible' }}>
              <line x1="0" y1="50%" x2="16" y2="33%" stroke="rgba(56,232,198,0.3)" strokeWidth="0.5" />
              <line x1="0" y1="50%" x2="24" y2="66%" stroke="rgba(139,108,255,0.3)" strokeWidth="0.5" />
              <line x1="16" y1="33%" x2="32" y2="50%" stroke="rgba(56,232,198,0.2)" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pl-28 md:pl-40">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#F5F7FA] mb-2">
                Need something more ambitious?
              </h2>
              <p className="text-[#AAB4C3] text-sm md:text-base">
                Business systems from <span className="text-[#F5F7FA] font-semibold">£4,995</span> · SaaS platforms from <span className="text-[#F5F7FA] font-semibold">£20,000</span> · AI automation from <span className="text-[#F5F7FA] font-semibold">£1,495</span>
              </p>
            </div>
            <Link
              href="/contact?need=discovery&package=Bespoke%20Build"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold border border-[rgba(148,163,184,0.25)] text-[#F5F7FA] bg-[rgba(15,23,42,0.4)] hover:border-[#38E8C6]/40 hover:text-[#38E8C6] hover:bg-[rgba(56,232,198,0.08)] hover:shadow-[0_0_20px_rgba(56,232,198,0.1)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38E8C6]/50 shrink-0 active:scale-[0.98]"
            >
              Plan a Bespoke Build
              <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}