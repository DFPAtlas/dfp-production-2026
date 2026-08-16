import type { ReproductionActionType } from './types';
import {
  SUPPORTED_ACTION_TYPES, FORBIDDEN_ACTION_PATTERNS,
  ALLOWED_TEST_REFERENCES, DEFAULT_STEP_TIMEOUT_MS,
} from './types';

export function validateActionType(action: string): action is ReproductionActionType {
  return SUPPORTED_ACTION_TYPES.includes(action as ReproductionActionType);
}

export function validateSteps(steps: Array<{ action_type: string; safe_selector?: string | null; input_reference?: string | null }>): { valid: boolean; error?: string } {
  for (const step of steps) {
    if (!validateActionType(step.action_type)) {
      return { valid: false, error: `Unsupported action type: ${step.action_type}` };
    }

    const combined = `${step.action_type} ${step.safe_selector || ''} ${step.input_reference || ''}`;
    for (const pattern of FORBIDDEN_ACTION_PATTERNS) {
      if (pattern.test(combined)) {
        return { valid: false, error: `Forbidden pattern detected in step` };
      }
    }

    if (step.input_reference && !ALLOWED_TEST_REFERENCES.includes(step.input_reference as any)) {
      if (!step.input_reference.startsWith('TEST_')) {
        return { valid: false, error: `Unrecognised input reference: ${step.input_reference}. Use TEST_ prefixed references.` };
      }
    }

    if ((step.action_type === 'click' || step.action_type === 'fill' || step.action_type === 'select' || step.action_type === 'check' || step.action_type === 'uncheck' || step.action_type === 'wait_for' || step.action_type === 'assert_visible' || step.action_type === 'assert_text') && !step.safe_selector) {
      return { valid: false, error: `Action ${step.action_type} requires a safe_selector` };
    }

    if (step.action_type === 'fill' && !step.input_reference) {
      return { valid: false, error: 'Fill action requires input_reference' };
    }

    if (step.action_type === 'navigate' && !step.safe_selector) {
      return { valid: false, error: 'Navigate action requires a target URL in safe_selector' };
    }
  }

  return { valid: true };
}

export function sanitiseStepForWorker(step: { action_type: string; target_description?: string | null; safe_selector?: string | null; input_reference?: string | null; expected_outcome?: string | null }): {
  action_type: string;
  target_description: string | null;
  safe_selector: string | null;
  input_reference: string | null;
  expected_outcome: string | null;
} {
  return {
    action_type: step.action_type,
    target_description: (step.target_description || '').substring(0, 500) || null,
    safe_selector: (step.safe_selector || '').substring(0, 500) || null,
    input_reference: step.input_reference || null,
    expected_outcome: (step.expected_outcome || '').substring(0, 500) || null,
  };
}

export function resolveCredentialValue(reference: string | null, credentialStore: Record<string, string>): string {
  if (!reference) return '';
  if (credentialStore[reference]) return credentialStore[reference];
  if (reference === 'TEST_USER_EMAIL') return 'test@digital-footprint.uk';
  if (reference === 'TEST_USER_PASSWORD') return 'TestPass123!';
  if (reference === 'TEST_BOOKING_REFERENCE') return 'DFP-TEST-' + Date.now().toString(36).toUpperCase();
  if (reference === 'TEST_PAYMENT_CARD') return '4242424242424242';
  if (reference === 'TEST_REFERENCE_CODE') return 'TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  return reference;
}

export function isStoppableError(code: string): boolean {
  const stoppable = [
    'origin_violation', 'credential_failure', 'sandbox_expired',
    'worker_cancellation', 'critical_security', 'context_lost',
  ];
  return stoppable.includes(code);
}

export function getStepTimeout(actionType: ReproductionActionType): number {
  if (actionType === 'navigate') return 30000;
  if (actionType === 'wait_for') return 20000;
  return DEFAULT_STEP_TIMEOUT_MS;
}