import TesterSandbox from './TesterSandbox';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function TesterSandboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TesterSandbox assignmentId={id} />;
}