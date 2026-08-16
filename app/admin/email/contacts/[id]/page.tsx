import ContactDetail from './ContactDetail'

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ContactDetail />
}