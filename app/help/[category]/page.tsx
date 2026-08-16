import HelpCategoryClient from './HelpCategoryClient';

export async function generateStaticParams() {
  return [
    { category: 'getting-started' },
    { category: 'account-and-billing' },
    { category: 'projects-and-tasks' },
    { category: 'file-management' },
    { category: 'security-and-privacy' },
    { category: 'integrations' },
    { category: 'troubleshooting' },
    { category: 'account-settings' },
  ];
}

export default async function HelpCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  return <HelpCategoryClient category={resolvedParams.category} />;
}