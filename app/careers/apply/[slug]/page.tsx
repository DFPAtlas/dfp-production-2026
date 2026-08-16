import CareersApplyClient from './CareersApplyClient';

export async function generateStaticParams() {
  return [
    { slug: 'senior-frontend-engineer' },
    { slug: 'cloud-infrastructure-engineer' },
    { slug: 'graduate-software-developer' },
    { slug: 'product-manager-saas' },
  ];
}

export default async function CareersApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <CareersApplyClient slug={resolvedParams.slug} />;
}