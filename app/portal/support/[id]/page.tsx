import TicketDetail from './TicketDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TicketDetail ticketId={resolvedParams.id} />;
}