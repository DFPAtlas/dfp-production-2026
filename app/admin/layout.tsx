import AdminAccessGate from '@/components/admin/AdminAccessGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessGate>
      {children}
    </AdminAccessGate>
  );
}