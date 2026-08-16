import AutomationEditor from './AutomationEditor';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function AutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const isNew = resolvedParams.id === 'new';
  return <AutomationEditor automationId={isNew ? null : resolvedParams.id} />;
}