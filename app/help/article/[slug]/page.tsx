import HelpArticleDetail from './HelpArticleDetail';

export async function generateStaticParams() {
  return [
    { slug: 'getting-started-with-digital-footprint' },
    { slug: 'how-to-sign-in-to-your-client-portal' },
    { slug: 'understanding-your-invoice-and-making-payment' },
    { slug: 'troubleshooting-common-portal-issues' },
    { slug: 'privacy-and-data-protection' },
    { slug: 'how-to-report-a-security-concern' },
    { slug: 'getting-started-with-cloud-pbx' },
    { slug: 'understanding-the-uat-testing-process' },
  ];
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <HelpArticleDetail slug={resolvedParams.slug} />;
}