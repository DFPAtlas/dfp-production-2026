import Tester360Workspace from '@/components/admin/uat/Tester360Workspace';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function TesterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <Tester360Workspace testerId={resolvedParams.id} />;
}