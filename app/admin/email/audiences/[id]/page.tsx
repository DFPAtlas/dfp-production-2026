import AudienceDetail from './AudienceDetail'

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function AudiencePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <AudienceDetail />
}