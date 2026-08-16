'use client';

interface Props {
  activeView: string;
  onNavigate: (view: string) => void;
}

const items = [
  { key: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { key: 'properties', label: 'Properties', icon: 'ri-home-4-line' },
  { key: 'maintenance', label: 'Repairs', icon: 'ri-tools-line' },
  { key: 'rent', label: 'Rent', icon: 'ri-wallet-line' },
  { key: 'messages', label: 'Messages', icon: 'ri-message-2-line' },
];

export default function MobileNav({ activeView, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#e8e5df] bg-white px-2 py-2 lg:hidden">
      {items.map((item) => {
        const isActive = activeView === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition cursor-pointer ${
              isActive ? 'text-[#0d9488]' : 'text-[#8a8a8a]'
            }`}
          >
            <i className={`${item.icon} text-base`} />
            <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}