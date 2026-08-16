import NewTestSuite from './NewTestSuite';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function NewTestSuitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NewTestSuite projectId={id} />;
}