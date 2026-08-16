export default function HowPricingWorks() {
  const steps = [
    {
      title: 'Define the scope',
      desc: 'We confirm goals, workflows, integrations and deliverables before development begins.',
      icon: 'ri-clipboard-line',
    },
    {
      title: 'Build through milestones',
      desc: 'Larger projects are divided into agreed stages with visible progress and approval points.',
      icon: 'ri-hammer-line',
    },
    {
      title: 'Launch with support',
      desc: 'Every project includes handover and a clear route into ongoing care.',
      icon: 'ri-rocket-line',
    },
  ];

  return (
    <section className="px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#F5F7FA] text-center mb-10">
          How pricing works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.6)] backdrop-blur-sm p-6 md:p-8"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(56,232,198,0.1)] flex items-center justify-center mb-4">
                <i className={`${step.icon} text-[#38E8C6] w-5 h-5 flex items-center justify-center`} />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F7FA] mb-2">{step.title}</h3>
              <p className="text-sm text-[#AAB4C3] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}