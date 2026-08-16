import Lead360Workspace from './Lead360Workspace';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <Lead360Workspace leadId={resolvedParams.id} />;
}