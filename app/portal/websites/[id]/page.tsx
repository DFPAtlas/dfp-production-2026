import WebsiteDetail from './WebsiteDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function WebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <WebsiteDetail websiteId={resolvedParams.id} />;
}