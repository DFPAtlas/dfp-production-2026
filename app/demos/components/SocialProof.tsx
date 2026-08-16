export default function SocialProof() {
  const items = [
    {
      step: 'Interact',
      desc: 'Change something inside the demo. Move a task, qualify a lead, approve a project.',
      icon: 'ri-cursor-line',
      bg: 'bg-cyan-300/10',
      iconColor: '#67e8f9',
    },
    {
      step: 'Watch',
      desc: 'See connected parts of the system respond. A task assigned updates the workload view. A lead qualified moves the pipeline.',
      icon: 'ri-eye-line',
      bg: 'bg-orange-300/10',
      iconColor: '#fdba74',
    },
    {
      step: 'Imagine',
      desc: 'Replace the fictional company with yours. The business data, people, projects and processes become yours.',
      icon: 'ri-lightbulb-line',
      bg: 'bg-violet-300/10',
      iconColor: '#c4b5fd',
    },
  ];

  return (
    <section className="relative px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(52,211,153,0.03),transparent_50%)]" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            These aren&apos;t screenshots.
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Each flagship experience contains interactive workflows designed to show how different parts of a business system can react together.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.step} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center">
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} mb-5`}>
                <i className={item.icon} style={{ color: item.iconColor, fontSize: '1.25rem' }} />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.step}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}