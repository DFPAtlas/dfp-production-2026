'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CampaignData } from '@/components/admin/email/campaigns/campaign-types';
import CampaignWizard from './CampaignWizard';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface CampaignWizardPageProps {
  campaignId: string;
}

export default function CampaignWizardPage({ campaignId }: CampaignWizardPageProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isNew = campaignId === 'new';

  useEffect(() => {
    if (isNew) {
      setCampaign({
        name: '',
        description: '',
        brand_kit_id: null,
        campaign_type: 'marketing',
        source_template_id: null,
        source_template_version_id: null,
        status: 'draft',
        owner_id: null,
        tags: [],
      });
      setLoading(false);
      return;
    }

    const fetchCampaign = async () => {
      const { data, error } = await supabase.from('email_campaigns').select('*').eq('id', campaignId).maybeSingle();
      if (error || !data) {
        setError('Campaign not found or access denied.');
        setLoading(false);
        return;
      }
      setCampaign(data as CampaignData);
      setLoading(false);
    };
    fetchCampaign();
  }, [campaignId, isNew]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{error || 'Campaign not found'}</h2>
        <Link href="/admin/email/campaigns"
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
      </div>
    );
  }

  return <CampaignWizard campaign={campaign} isNew={isNew} />;
}