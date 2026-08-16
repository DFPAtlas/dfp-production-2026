import AutomationActivityClient from './AutomationActivityClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function AutomationActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <AutomationActivityClient params={resolvedParams} />;
}