import ReviewDetailClient from './ReviewDetailClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ReviewDetailClient id={resolvedParams.id} />;
}