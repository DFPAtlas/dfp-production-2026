import AdminFeedbackDetail from './AdminFeedbackDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminFeedbackDetail feedbackId={id} />;
}