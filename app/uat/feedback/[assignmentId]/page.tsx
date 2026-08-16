import FeedbackForm from './FeedbackForm';

export async function generateStaticParams() {
  return [
    { assignmentId: '1' },
    { assignmentId: '2' },
    { assignmentId: '3' },
  ];
}

export default async function FeedbackPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  return <FeedbackForm assignmentId={assignmentId} />;
}