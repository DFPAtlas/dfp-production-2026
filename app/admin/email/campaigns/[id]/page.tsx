import CampaignWizardPage from './CampaignWizardPage';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CampaignWizardPage campaignId={resolvedParams.id} />;
}