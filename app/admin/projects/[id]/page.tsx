import ProjectCommandWorkspace from './ProjectCommandWorkspace';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ProjectCommandWorkspace projectId={resolvedParams.id} />;
}