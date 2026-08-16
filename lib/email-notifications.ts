'use client';

import { supabase } from '@/lib/supabase';

const EDGE_FUNCTION_URL = 'https://zjqftnkrmqhmbrtkvafy.supabase.co/functions/v1/send-portal-notification-email';

interface SendEmailParams {
  to_user_id?: string;
  to_email?: string;
  to_name?: string;
  subject: string;
  html: string;
  event_type: string;
  related_entity_id?: string;
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<void> {
  const idempotency_key = `email:${params.event_type}:${params.related_entity_id || Date.now()}:${params.to_user_id || params.to_email || 'unknown'}`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to_user_id: params.to_user_id,
        to_email: params.to_email,
        to_name: params.to_name,
        subject: params.subject,
        html: params.html,
        idempotency_key,
        event_type: params.event_type,
        related_entity_id: params.related_entity_id,
      }),
    });

    const result = await response.json();
  } catch {
    // silently ignore email failures
  }
}

export function buildClientReplyEmailHtml(
  clientName: string,
  messageContent: string,
  threadSubject: string,
  portalUrl: string,
  isStaffReply: boolean,
): string {
  const actionLabel = isStaffReply ? 'DFP Team replied' : 'New message';
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0891B2, #06B6D4); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Digital Footprint</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px;"><strong>${actionLabel}:</strong> ${escapeHtml(threadSubject)}</p>
        <div style="background: #f8fafc; border-left: 3px solid #06B6D4; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">${escapeHtml(messageContent.slice(0, 500))}${messageContent.length > 500 ? '...' : ''}</p>
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px;">${isStaffReply ? 'A member of the Digital Footprint team has replied to your message.' : 'You have a new message from ' + escapeHtml(clientName) + '.'}</p>
        <a href="${portalUrl}" style="display: inline-block; background: #06B6D4; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View in Portal</a>
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">Digital Footprint — Client Portal</p>
      </div>
    </div>
  `;
}

export function buildTicketEmailHtml(
  action: 'created' | 'replied' | 'status_changed' | 'awaiting_client' | 'reopened' | 'assigned',
  ticketRef: string,
  ticketSubject: string,
  detail: string,
  portalUrl: string,
): string {
  const titles: Record<string, string> = {
    created: 'Support Ticket Created',
    replied: 'New Reply on Support Ticket',
    status_changed: 'Support Ticket Updated',
    awaiting_client: 'Action Required on Support Ticket',
    reopened: 'Support Ticket Reopened',
    assigned: 'Support Ticket Assigned',
  };

  const descriptions: Record<string, string> = {
    created: 'Your support request has been received and our team will review it shortly.',
    replied: 'A new reply has been added to your support ticket.',
    status_changed: `The status has been updated to: ${detail}`,
    awaiting_client: 'Our team needs more information from you to continue.',
    reopened: 'This ticket has been reopened.',
    assigned: `This ticket has been assigned to a team member: ${detail}`,
  };

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #7C3AED, #8B5CF6); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Digital Footprint Support</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #1e293b; margin: 0 0 8px;"><strong>${titles[action] || 'Update'}</strong></p>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px;">${ticketRef} — ${escapeHtml(ticketSubject)}</p>
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">${descriptions[action] || detail}</p>
        <a href="${portalUrl}" style="display: inline-block; background: #8B5CF6; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">Digital Footprint — Client Portal</p>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}