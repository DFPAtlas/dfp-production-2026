export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

import ProjectDetailClient from './ProjectDetailClient';

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}