export default function DFPMethod() {
  const steps = [
    { num: '1', label: 'Discover', icon: 'ri-search-line' },
    { num: '2', label: 'Define', icon: 'ri-file-list-3-line' },
    { num: '3', label: 'Design', icon: 'ri-pencil-line' },
    { num: '4', label: 'Develop', icon: 'ri-code-s-slash-line' },
    { num: '5', label: 'Deliver', icon: 'ri-send-plane-line' },
  ];

  return (
    <section className="px-6 pb-20">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#F5F7FA] mb-10">
          Every build follows the DFP method
        </h2>

        <div className="hidden md:flex items-center justify-between relative">
          <div
            className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#38E8C6]/40 to-transparent"
            aria-hidden="true"
          />
          {steps.map((step) => (
            <div key={step.label} className="relative z-10 flex flex-col items-center group">
              <div className="w-12 h-12 rounded-full bg-[#111827] border border-[rgba(148,163,184,0.3)] flex items-center justify-center mb-3 group-hover:border-[#38E8C6]/50 transition-colors">
                <span className="text-sm font-bold text-[#38E8C6]">{step.num}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[rgba(56,232,198,0.1)] flex items-center justify-center mb-2">
                <i className={`${step.icon} text-[#38E8C6] w-4 h-4 flex items-center justify-center`} />
              </div>
              <span className="text-sm text-[#F5F7FA] font-medium">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="md:hidden flex flex-col items-start gap-6 relative pl-6">
          <div
            className="absolute left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#38E8C6]/40 to-transparent"
            aria-hidden="true"
          />
          {steps.map((step) => (
            <div key={step.label} className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#111827] border border-[rgba(148,163,184,0.3)] flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#38E8C6]">{step.num}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[rgba(56,232,198,0.1)] flex items-center justify-center">
                  <i className={`${step.icon} text-[#38E8C6] w-3 h-3 flex items-center justify-center`} />
                </div>
                <span className="text-sm text-[#F5F7FA] font-medium">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}