import ExperimentReportClient from './ExperimentReportClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ExperimentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ExperimentReportClient params={resolvedParams} />;
}