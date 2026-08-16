import UATPortalShell from '@/components/uat/UATPortalShell';
import UATTesterTermsGate from '@/components/UATTesterTermsGate';

export default function UATPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <UATTesterTermsGate>
      <UATPortalShell>{children}</UATPortalShell>
    </UATTesterTermsGate>
  );
}