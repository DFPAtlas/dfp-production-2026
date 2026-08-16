export type MessageType = 'email' | 'sms' | 'webhook' | 'notification';
export type MessageDirection = 'outbound' | 'inbound_test';
export type MessageStatus = 'intercepted' | 'simulated_delivered' | 'simulated_failed' | 'blocked' | 'quarantined' | 'reviewed' | 'expired';
export type DeliverySimulation = 'intercept_only' | 'simulate_delivered' | 'simulate_failed';
export type EventType = 'captured' | 'blocked' | 'simulated_delivered' | 'simulated_failed' | 'opened_in_test_mailbox' | 'attachment_downloaded' | 'linked_to_test_case' | 'linked_to_feedback' | 'quarantined' | 'expired';

export interface UATSandboxMessage {
  id: string;
  project_id: string;
  environment_id: string | null;
  assignment_id: string;
  session_id: string | null;
  sandbox_instance_id: string | null;
  tester_id: string;
  message_type: MessageType;
  direction: MessageDirection;
  provider_name: string | null;
  provider_message_reference: string | null;
  sender_address: string | null;
  recipient_address: string | null;
  recipient_display: string | null;
  subject: string | null;
  safe_preview: string | null;
  content_text: string | null;
  content_html_reference: string | null;
  template_reference: string | null;
  status: MessageStatus;
  delivery_simulation: DeliverySimulation;
  failure_code: string | null;
  sent_at: string | null;
  intercepted_at: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  attachment_count?: number;
  linked_cases?: number;
  linked_feedback?: number;
}

export interface UATSandboxMessageEvent {
  id: string;
  message_id: string;
  event_type: EventType;
  actor_user_id: string | null;
  safe_metadata: Record<string, unknown>;
  created_at: string;
}

export interface UATMessageAttachment {
  id: string;
  message_id: string;
  evidence_id: string | null;
  original_filename: string;
  safe_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_path: string;
  status: 'stored' | 'quarantined' | 'deleted';
  created_at: string;
}

export interface MailboxStats {
  email: number;
  sms: number;
  webhook: number;
  blocked: number;
  total: number;
  latest: string | null;
}

export interface CommunicationSettings {
  id: string;
  project_id: string;
  environment_id: string | null;
  email_interception_enabled: boolean;
  sms_interception_enabled: boolean;
  webhook_interception_enabled: boolean;
  block_unapproved_recipients: boolean;
  allowed_email_domains: string[];
  allowed_phone_prefixes: string[];
  allowed_webhook_origins: string[];
  delivery_simulation_mode: DeliverySimulation | 'project_adapter';
  retention_days: number;
  maximum_message_size_bytes: number;
}

export interface InterceptResult {
  success: boolean;
  intercepted?: boolean;
  message_id?: string;
  status?: string;
  error?: string;
}