import TesterEvents from './TesterEvents';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function Page({ params }: { params: { id: string } }) {
  return <TesterEvents assignmentId={params.id} />;
}