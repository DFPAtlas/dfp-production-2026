import TestSuitesList from './TestSuitesList';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function TestSuitesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestSuitesList projectId={id} />;
}