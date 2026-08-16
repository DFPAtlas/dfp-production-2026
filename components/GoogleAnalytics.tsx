"use client";

import Script from "next/script";
import { useEffect, useState, useRef } from "react";
import { hasConsentFor, getConsentState } from "@/lib/analytics";
import type { ConsentState } from "@/lib/analytics-definitions";
import { CONSENT_CATEGORIES, CONSENT_STORAGE_KEY } from "@/lib/analytics-definitions";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    GA_LOADED?: boolean;
    gtag?: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  const [consentReady, setConsentReady] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const checkConsent = () => {
      if (!mountedRef.current) return;
      const hasGiven = hasConsentFor('analytics');
      setAnalyticsAllowed(hasGiven);
      setConsentReady(true);
    };

    checkConsent();

    const handleStorage = () => {
      checkConsent();
    };

    window.addEventListener('storage', handleStorage);

    const handleCustomConsent = () => {
      checkConsent();
    };
    window.addEventListener('dfp-consent-updated', handleCustomConsent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dfp-consent-updated', handleCustomConsent);
    };
  }, []);

  useEffect(() => {
    if (consentReady && analyticsAllowed && !window.GA_LOADED) {
      window.GA_LOADED = true;
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: hasConsentFor('marketing') ? 'granted' : 'denied',
          functionality_storage: hasConsentFor('functional') ? 'granted' : 'denied',
          personalization_storage: hasConsentFor('functional') ? 'granted' : 'denied',
        });
      }
    }
  }, [consentReady, analyticsAllowed]);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  if (!consentReady) {
    return null;
  }

  if (!analyticsAllowed) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure',
            analytics_storage: 'granted',
            ad_storage: 'denied',
          });
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
          });
        `}
      </Script>
    </>
  );
}