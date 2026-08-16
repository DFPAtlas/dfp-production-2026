export default function PricingFAQ() {
  const items = [
    { q: 'Do these prices include VAT?', a: 'VAT is added only when applicable and will always be shown clearly in the proposal or checkout.' },
    { q: 'Why do some prices say "From"?', a: 'Websites, software and AI systems vary by scope. The starting price covers the defined base package, and we confirm any additions before work begins.' },
    { q: 'Are third-party services included?', a: 'External services such as domains, premium software, messaging, AI usage and specialist integrations are itemised separately.' },
    { q: 'How are projects paid for?', a: 'Website projects normally use staged payments. Larger software projects are divided into discovery, prototype, development and launch milestones.' },
    { q: 'Can I request something not listed?', a: 'Yes. Use the bespoke-build option and tell us what the business needs to achieve.' },
    { q: 'Can I change care plans later?', a: 'Yes. Care-plan changes can be reviewed as the website or system evolves.' },
  ];

  return (
    <section className="px-6 pb-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#F5F7FA] text-center mb-10">
          Questions about pricing
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.6)] backdrop-blur-sm overflow-hidden group"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-[#F5F7FA] font-medium text-sm md:text-base hover:bg-[rgba(56,232,198,0.05)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38E8C6]/50 rounded-xl">
                <span>{item.q}</span>
                <i className="ri-add-line w-5 h-5 flex items-center justify-center text-[#AAB4C3] group-open:hidden shrink-0" />
                <i className="ri-subtract-line w-5 h-5 flex items-center justify-center text-[#38E8C6] hidden group-open:flex shrink-0" />
              </summary>
              <div className="px-5 pb-4 text-sm text-[#AAB4C3] leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}