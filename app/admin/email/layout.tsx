import EmailShell from '@/components/admin/email/EmailShell';

export default function EmailStudioLayout({ children }: { children: React.ReactNode }) {
  return <EmailShell>{children}</EmailShell>;
}