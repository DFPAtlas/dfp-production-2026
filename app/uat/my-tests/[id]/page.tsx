import TestDetail from './TestDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function MyTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestDetail assignmentId={id} />;
}