import {
  ALLOWED_PUBLIC_EVENTS,
  AllowedEventName,
  SafePayload,
  DISALLOWED_PAYLOAD_FIELDS,
  SENSITIVE_QUERY_PARAMS,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  ConsentState,
  ConsentCategory,
  ALLOWED_PAYLOAD_FIELDS,
  DeviceClass,
  CONSENT_CATEGORIES,
} from './analytics-definitions';

const ANALYTICS_ENABLED = typeof window !== 'undefined';
const SESSION_KEY = 'dfp_anonymous_session';
const CONVERSION_IDEMPOTENCY_PREFIX = 'dfp_conv_';
const EVENT_IDEMPOTENCY_PREFIX = 'dfp_evt_';

interface GtagFn {
  (command: 'js', date: Date): void;
  (command: 'config', id: string, params?: Record<string, unknown>): void;
  (command: 'event', name: string, params?: Record<string, unknown>): void;
  (command: 'consent', action: string, params?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFn;
    GA_LOADED?: boolean;
  }
}

export function getAnonymousSessionRef(): string {
  if (!ANALYTICS_ENABLED) return '';
  try {
    let ref = sessionStorage.getItem(SESSION_KEY);
    if (!ref) {
      ref = 's_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, ref);
    }
    return ref;
  } catch {
    return '';
  }
}

export function getConsentState(): ConsentState | null {
  if (!ANALYTICS_ENABLED) return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (!parsed.version || !Array.isArray(parsed.categories)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasConsentFor(category: ConsentCategory): boolean {
  const state = getConsentState();
  if (!state) return category === 'necessary';
  return state.categories.includes(category);
}

export function updateAnalyticsConsent(categories: ConsentCategory[]): void {
  if (!ANALYTICS_ENABLED) return;
  const alwaysNecessary = categories.includes('necessary') ? categories : ['necessary' as ConsentCategory, ...categories];
  const state: ConsentState = {
    version: CONSENT_VERSION,
    categories: alwaysNecessary,
    updatedAt: new Date().toISOString(),
    withdrawnAt: null,
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage unavailable */ }

  if (typeof window.gtag === 'function') {
    const gtagConsent: Record<string, string> = {};
    for (const cat of CONSENT_CATEGORIES) {
      gtagConsent[`analytics_storage`] = alwaysNecessary.includes('analytics') ? 'granted' : 'denied';
      gtagConsent[`ad_storage`] = alwaysNecessary.includes('marketing') ? 'granted' : 'denied';
      gtagConsent[`functionality_storage`] = alwaysNecessary.includes('functional') ? 'granted' : 'denied';
      gtagConsent[`personalization_storage`] = alwaysNecessary.includes('functional') ? 'granted' : 'denied';
    }
    window.gtag('consent', 'update', gtagConsent);
  }
}

function getDeviceClass(): DeviceClass {
  if (!ANALYTICS_ENABLED) return 'unknown';
  const w = window.innerWidth;
  if (w >= 1024) return 'desktop';
  if (w >= 640) return 'tablet';
  if (w > 0) return 'mobile';
  return 'unknown';
}

function getLanguage(): string {
  if (!ANALYTICS_ENABLED) return '';
  return navigator.language?.substring(0, 2) || '';
}

function stripSensitiveParams(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    for (const param of SENSITIVE_QUERY_PARAMS) {
      u.searchParams.delete(param);
    }
    return u.pathname + (u.search ? u.search : '');
  } catch {
    return url;
  }
}

function getReferringDomain(): string {
  if (!ANALYTICS_ENABLED) return '';
  try {
    const referrer = document.referrer;
    if (!referrer) return '';
    const url = new URL(referrer);
    if (url.hostname === window.location.hostname) return '';
    return url.hostname;
  } catch {
    return '';
  }
}

function extractUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string } {
  if (!ANALYTICS_ENABLED) return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const val = params.get(key);
      if (val && val.length <= 256) {
        result[key] = val;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function sanitizePayload(input: Record<string, unknown>): SafePayload {
  const safe: SafePayload = {};

  for (const key of Object.keys(input)) {
    if (DISALLOWED_PAYLOAD_FIELDS.includes(key)) continue;
    if (!ALLOWED_PAYLOAD_FIELDS.includes(key)) continue;

    const val = input[key];
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      const trimmed = val.trim().substring(0, 256);
      if (trimmed) safe[key as keyof SafePayload] = trimmed as never;
    }
  }

  return safe;
}

function isEventIdempotent(key: string, ttlMs = 60000): boolean {
  if (!ANALYTICS_ENABLED) return false;
  try {
    const fullKey = EVENT_IDEMPOTENCY_PREFIX + key;
    const existing = sessionStorage.getItem(fullKey);
    if (existing) {
      const ts = parseInt(existing, 10);
      if (Date.now() - ts < ttlMs) return true;
    }
    sessionStorage.setItem(fullKey, String(Date.now()));
    return false;
  } catch {
    return false;
  }
}

function isConversionIdempotent(key: string): boolean {
  if (!ANALYTICS_ENABLED) return false;
  try {
    const fullKey = CONVERSION_IDEMPOTENCY_PREFIX + key;
    const existing = localStorage.getItem(fullKey);
    if (existing) return true;
    localStorage.setItem(fullKey, String(Date.now()));
    return false;
  } catch {
    return false;
  }
}

export function trackPageView(route?: string): void {
  if (!ANALYTICS_ENABLED) return;
  if (!hasConsentFor('analytics')) return;

  const cleanRoute = stripSensitiveParams(route || window.location.pathname + window.location.search);
  const idempotencyKey = 'pv_' + cleanRoute + '_' + getAnonymousSessionRef();

  if (isEventIdempotent(idempotencyKey, 5000)) return;

  const utm = extractUtmParams();
  const payload: SafePayload = {
    page_route: cleanRoute,
    device_class: getDeviceClass(),
    language: getLanguage(),
    referring_domain: getReferringDomain(),
    anonymous_session_ref: getAnonymousSessionRef(),
    consent_state: 'analytics_consented',
    environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
    event_idempotency_key: idempotencyKey,
    ...utm,
  };

  dispatchEvent('public_page_viewed', payload);
}

function dispatchEvent(name: AllowedEventName, payload: SafePayload): void {
  if (!ALLOWED_PUBLIC_EVENTS.includes(name as typeof ALLOWED_PUBLIC_EVENTS[number])) return;
  if (!ANALYTICS_ENABLED) return;

  const finalPayload = sanitizePayload({ ...payload });

  if (typeof window.gtag === 'function' && hasConsentFor('analytics')) {
    try {
      window.gtag('event', name, {
        ...finalPayload,
        send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      });
    } catch { /* provider failure */ }
  }
}

export function trackPublicEvent(name: AllowedEventName, payload: Record<string, unknown> = {}): void {
  if (!ANALYTICS_ENABLED) return;
  if (!ALLOWED_PUBLIC_EVENTS.includes(name as typeof ALLOWED_PUBLIC_EVENTS[number])) return;
  if (!hasConsentFor('analytics')) return;

  const idempotencyKey = 'evt_' + name + '_' + getAnonymousSessionRef() + '_' + Date.now().toString(36);

  const fullPayload: SafePayload = {
    page_route: stripSensitiveParams(window.location.pathname + window.location.search),
    device_class: getDeviceClass(),
    language: getLanguage(),
    anonymous_session_ref: getAnonymousSessionRef(),
    consent_state: 'analytics_consented',
    environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
    event_idempotency_key: idempotencyKey,
    ...extractUtmParams(),
    ...sanitizePayload(payload),
  };

  dispatchEvent(name, fullPayload);
}

export function trackConversion(conversionType: string, conversionRef: string, additionalPayload: Record<string, unknown> = {}): void {
  if (!ANALYTICS_ENABLED) return;
  if (!hasConsentFor('analytics')) return;

  if (isConversionIdempotent(conversionRef)) return;

  const payload: SafePayload = {
    conversion_type: conversionType,
    conversion_ref: conversionRef,
    page_route: stripSensitiveParams(window.location.pathname + window.location.search),
    device_class: getDeviceClass(),
    language: getLanguage(),
    anonymous_session_ref: getAnonymousSessionRef(),
    consent_state: 'analytics_consented',
    environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
    ...extractUtmParams(),
    ...sanitizePayload(additionalPayload),
  };

  const eventName = conversionTypeToEvent(conversionType);
  if (eventName) {
    dispatchEvent(eventName, payload);
  }
}

function conversionTypeToEvent(type: string): AllowedEventName | null {
  const map: Record<string, AllowedEventName> = {
    'contact_form': 'contact_submitted',
    'demo_request': 'demo_request_submitted',
    'early_access': 'early_access_submitted',
    'support_request': 'support_request_submitted',
    'partner_application': 'partner_application_submitted',
    'referral': 'referral_submitted',
    'career_application': 'career_application_submitted',
    'strategy_request': 'strategy_request_submitted',
    'quote_request': 'quote_request_submitted',
    'security_report': 'security_report_submitted',
    'accessibility_issue': 'accessibility_issue_submitted',
  };
  return map[type] || null;
}

export function isTestOrAdminSession(): boolean {
  if (!ANALYTICS_ENABLED) return true;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return true;
  if (path.startsWith('/staff')) return true;
  if (path.includes('/preview') || path.includes('/draft')) return true;
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('staging')) return true;
  return false;
}