import AreaGate from '@/components/AreaGate';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaGate
      loginPath="/portal/login"
      publicPaths={['/portal/login']}
    >
      {children}
    </AreaGate>
  );
}