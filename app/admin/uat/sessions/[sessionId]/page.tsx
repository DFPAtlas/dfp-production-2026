import SessionClient from './SessionClient';

export async function generateStaticParams() {
  return [
    { sessionId: '1' },
    { sessionId: '2' },
    { sessionId: '3' },
  ];
}

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = await params;
  return <SessionClient sessionId={resolvedParams.sessionId} />;
}