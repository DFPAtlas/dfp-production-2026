'use client';

export default function PortfolioRibbon() {
  return (
    <section className="relative bg-[#0D1F3C] border-y border-white/[0.03] overflow-hidden py-3.5">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0D1F3C] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0D1F3C] to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-6 items-center whitespace-nowrap group ribbon-track"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'paused';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'running';
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'paused';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'running';
        }}
        role="region"
        aria-label="Digital Footprint projects and capabilities"
        tabIndex={0}
      >
        {renderItems()}
        {renderItems()}
      </div>

      <style jsx>{`
        @keyframes ribbon-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ribbon-track {
          animation: ribbon-scroll 55s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ribbon-track {
            animation: none !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </section>
  );
}

function renderItems() {
  const items = [
    { text: 'QuickGuard', color: 'text-[#F97316]' },
    { text: 'GuardianHub', color: 'text-[#10B981]' },
    { text: 'LetHub', color: 'text-[#2563EB]' },
    { text: 'HomAura', color: 'text-[#7C3AED]' },
    { text: 'FisheryHub', color: 'text-[#06B6D4]' },
    { text: 'Corevia AI', color: 'text-[#EC4899]' },
    { text: 'DataHarbour', color: 'text-[#0891B2]' },
    { text: 'Homvia', color: 'text-[#D97706]' },
    { text: 'BivvyBox', color: 'text-slate-400' },
    { text: 'RackFlow', color: 'text-slate-400' },
    { text: 'Security Technology', color: 'text-slate-500' },
    { text: 'Property Technology', color: 'text-slate-500' },
    { text: 'Smart Homes', color: 'text-slate-500' },
    { text: 'Data Intelligence', color: 'text-slate-500' },
    { text: 'Ecommerce', color: 'text-slate-500' },
    { text: 'AI Automation', color: 'text-slate-500' },
    { text: 'Robotics', color: 'text-slate-500' },
    { text: 'Operational SaaS', color: 'text-slate-500' },
    { text: 'ChairDock AI', color: 'text-slate-400' },
    { text: 'DriveDrop AI', color: 'text-slate-400' },
    { text: 'HotDesk Hub', color: 'text-slate-400' },
    { text: 'HR Voodoo', color: 'text-slate-400' },
    { text: 'DF Lead Engine', color: 'text-[#06B6D4]' },
    { text: 'DF Command Centre', color: 'text-[#06B6D4]' },
  ];

  return items.map((item, i) => (
    <div key={`${item.text}-${i}`} className="flex items-center gap-6">
      <span className={`text-sm font-medium whitespace-nowrap cursor-default transition-colors duration-300 hover:text-white ${item.color}`}>
        {item.text}
      </span>
      <span className="w-1 h-1 rounded-full bg-white/[0.1] shrink-0" aria-hidden="true" />
    </div>
  ));
}