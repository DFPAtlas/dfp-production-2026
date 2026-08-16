'use client';

import UATSessionTimeline from '@/components/admin/uat/UATSessionTimeline';

export default function SessionClient({ sessionId }: { sessionId: string }) {
  return <UATSessionTimeline sessionId={sessionId} />;
}