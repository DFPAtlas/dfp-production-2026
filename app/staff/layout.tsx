import AreaGate from '@/components/AreaGate';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AreaGate
      loginPath="/staff/login"
      requiredRoles={['staff', 'admin', 'super_admin']}
      profileTable="staff_profiles"
      publicPaths={['/staff/login']}
    >
      {children}
    </AreaGate>
  );
}