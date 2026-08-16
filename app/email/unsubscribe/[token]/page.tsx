import UnsubscribeClient from './UnsubscribeClient'

export async function generateStaticParams() {
  return [{ token: 'demo' }]
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  return <UnsubscribeClient />
}