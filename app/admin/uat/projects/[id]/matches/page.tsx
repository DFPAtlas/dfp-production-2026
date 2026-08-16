import MatchesClient from './MatchesClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ProjectMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <MatchesClient projectId={resolvedParams.id} />;
}