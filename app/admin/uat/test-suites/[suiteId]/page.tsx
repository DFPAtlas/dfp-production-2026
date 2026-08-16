import SuiteEditor from './SuiteEditor';

export async function generateStaticParams() {
  return [
    { suiteId: '1' },
    { suiteId: '2' },
    { suiteId: '3' },
  ];
}

export default async function SuiteEditorPage({ params }: { params: Promise<{ suiteId: string }> }) {
  const { suiteId } = await params;
  return <SuiteEditor suiteId={suiteId} />;
}