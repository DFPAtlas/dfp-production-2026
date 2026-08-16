'use client';

interface Props {
  activeView: string;
  onNavigate: (view: string) => void;
}

const nav = [
  { key: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { key: 'properties', label: 'Properties', icon: 'ri-home-4-line' },
  { key: 'tenancies', label: 'Tenancies', icon: 'ri-user-line' },
  { key: 'maintenance', label: 'Maintenance', icon: 'ri-tools-line' },
  { key: 'compliance', label: 'Compliance', icon: 'ri-shield-check-line' },
  { key: 'rent', label: 'Rent', icon: 'ri-wallet-line' },
  { key: 'documents', label: 'Documents', icon: 'ri-file-list-line' },
  { key: 'messages', label: 'Messages', icon: 'ri-message-2-line' },
];

export default function Sidebar({ activeView, onNavigate }: Props) {
  return (
    <nav className="hidden w-56 shrink-0 flex-col border-r border-[#e8e5df] bg-[#faf9f7] lg:flex">
      <div className="px-3 pt-4 pb-2">
        <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">Portfolio</p>
      </div>
      <div className="space-y-0.5 px-2">
        {nav.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-[#0d9488]/10 text-[#0d9488]'
                  : 'text-[#8a8a8a] hover:bg-[#f0eeea] hover:text-[#1a2332]'
              }`}
            >
              <i className={`${item.icon} text-sm`} />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}