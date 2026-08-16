import RequestDetail from './RequestDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <RequestDetail requestId={resolvedParams.id} />;
}