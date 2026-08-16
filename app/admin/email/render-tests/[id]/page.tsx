import RenderTestDetailClient from './RenderTestDetailClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function RenderTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <RenderTestDetailClient params={resolvedParams} />;
}