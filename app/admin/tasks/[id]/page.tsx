import TaskDetailWorkspace from './TaskDetailWorkspace';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TaskDetailWorkspace taskId={resolvedParams.id} />;
}