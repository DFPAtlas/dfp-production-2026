import AreaGate from '@/components/AreaGate';

export default function PBXLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaGate loginPath="/portal/login">
      {children}
    </AreaGate>
  );
}