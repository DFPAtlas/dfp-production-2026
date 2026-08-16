import AppDetailClient from './AppDetailClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <AppDetailClient id={resolvedParams.id} />;
}