'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import TemplateEditor from '@/components/admin/email/editor/TemplateEditor';
import { EmailTemplate } from '@/components/admin/email/editor/editor-types';
import { ArrowLeft, AlertTriangle, Mail } from 'lucide-react';

export default function TemplateEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetchTemplate = async () => {
      const { data, error: err } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (err) {
        setError('Failed to load template');
      } else if (!data) {
        setError('Template not found');
      } else {
        setTemplate(data as unknown as EmailTemplate);
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            {error === 'Template not found' ? (
              <Mail className="w-7 h-7 text-slate-500" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-red-400" />
            )}
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {error === 'Template not found' ? 'Template Not Found' : 'Error Loading Template'}
          </h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <Link
            href="/admin/email/templates"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return <TemplateEditor template={template} />;
}