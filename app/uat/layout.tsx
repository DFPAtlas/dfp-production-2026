import AreaGate from '@/components/AreaGate';
import UATTesterProvider from '@/components/uat/UATTesterProvider';
import UATPortalShell from '@/components/uat/portal/UATPortalShell';

export default function UATLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaGate loginPath="/login">
      <UATTesterProvider>
        <UATPortalShell>
          {children}
        </UATPortalShell>
      </UATTesterProvider>
    </AreaGate>
  );
}