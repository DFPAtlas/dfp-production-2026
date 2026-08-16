export default function TrustStrip() {
  const items = [
    { icon: 'ri-search-line', label: 'Discovery-led scope' },
    { icon: 'ri-calendar-check-line', label: 'Milestone payments' },
    { icon: 'ri-map-pin-user-line', label: 'UK-based support' },
    { icon: 'ri-lock-unlock-line', label: 'No hidden build fees' },
  ];

  return (
    <section className="px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.6)] backdrop-blur-sm p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {items.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 justify-center ${i < items.length - 1 ? 'md:border-r md:border-[rgba(148,163,184,0.2)]' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-[rgba(56,232,198,0.1)] flex items-center justify-center shrink-0">
                  <i className={`${item.icon} text-[#38E8C6] w-4 h-4 flex items-center justify-center`} />
                </div>
                <span className="text-sm text-[#F5F7FA] font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}