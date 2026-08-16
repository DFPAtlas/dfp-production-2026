import ReviewActivityClient from './ReviewActivityClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ReviewActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ReviewActivityClient id={resolvedParams.id} />;
}