import BrandKitEditorPage from '../BrandKitEditor';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function BrandKitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <BrandKitEditorPage />;
}