import Client360Workspace from './Client360Workspace';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <Client360Workspace clientId={resolvedParams.id} />;
}