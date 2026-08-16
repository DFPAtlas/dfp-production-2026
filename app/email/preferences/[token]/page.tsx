import PreferencesClient from './PreferencesClient'

export async function generateStaticParams() {
  return [{ token: 'demo' }]
}

export default async function PreferencesPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  return <PreferencesClient />
}