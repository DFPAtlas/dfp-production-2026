'use client';

import { useParams } from 'next/navigation';
import ProjectDetail from './ProjectDetail';

export default function ProjectDetailClient() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  return <ProjectDetail projectId={id} />;
}