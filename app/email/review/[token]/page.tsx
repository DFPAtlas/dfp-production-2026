import PublicReviewPortalClient from './PublicReviewPortalClient';

export async function generateStaticParams() {
  return [{ token: 'sample-token-1' }, { token: 'sample-token-2' }];
}

export default function PublicReviewPortalPage() {
  return <PublicReviewPortalClient />;
}