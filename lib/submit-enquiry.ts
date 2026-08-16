import { supabase } from './supabase';

export type SubmitResult =
  | { code: 'OK'; submissionId: string }
  | { code: 'ERROR'; message: string };

export type SubmissionTable =
  | 'leads'
  | 'digital_footprint_support'
  | 'partner_applications'
  | 'career_applications'
  | 'project_submissions'
  | 'uat_tester_applications';

export function makeSubmissionReference(prefix = 'dfp'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `sub_${crypto.randomUUID()}`;
  }
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function notifyLeadSubmission(sourceTable: SubmissionTable, sourceId: string): void {
  if (!supabase) return;
  void supabase.functions
    .invoke('send-lead-notification', {
      body: { source_table: sourceTable, source_id: sourceId },
    })
    .catch(() => {});
}

export async function submitEnquiry(
  table: SubmissionTable,
  payload: Record<string, unknown>,
  notify = false,
): Promise<SubmitResult> {
  const submissionId = makeSubmissionReference();
  if (!supabase) {
    return { code: 'ERROR', message: 'Submission service is not configured. Please try again later.' };
  }
  try {
    const { data, error } = await supabase.from(table).insert(payload as never).select('id');
    if (error) {
      if (error.code === '23505') {
        return { code: 'OK', submissionId };
      }
      return { code: 'ERROR', message: error.message || 'Unable to submit. Please try again.' };
    }
    const recordId = data?.[0]?.id as string | undefined;
    if (notify && recordId) {
      notifyLeadSubmission(table, recordId);
    }
    return { code: 'OK', submissionId };
  } catch {
    return { code: 'ERROR', message: 'Network error. Please check your connection and try again.' };
  }
}