'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatPriceMinor } from '@/lib/website-packages';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface OrderData {
  project_reference: string;
  package_id: string;
  package_name: string;
  starting_payment_minor: number;
  full_price_minor: number;
  remaining_balance_minor: number;
  second_milestone_minor: number;
  final_milestone_minor: number;
  payment_status: string;
}

type PageState = 'loading' | 'paid' | 'processing' | 'failed' | 'not_found';

const MAX_STATUS_ATTEMPTS = 10;
const STATUS_RETRY_DELAY_MS = 2000;

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const sessionId = searchParams.get('session_id') || '';

  const [state, setState] = useState<PageState>('loading');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!ref || !sessionId) {
      setState('not_found');
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function fetchOrder(attempt = 1) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/dfp-website-checkout-status?ref=${encodeURIComponent(ref)}&session_id=${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) {
          if (!cancelled) {
            setState(res.status === 404 ? 'not_found' : 'failed');
            setErrorMessage('We could not retrieve your payment status.');
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (!data || data.error) {
          setState('not_found');
          return;
        }

        setOrderData(data);

        if (data.payment_status === 'paid') {
          setState('paid');
          return;
        }

        if (data.payment_status === 'pending' || data.payment_status === 'processing') {
          setState('processing');
          if (attempt < MAX_STATUS_ATTEMPTS) {
            retryTimer = setTimeout(() => fetchOrder(attempt + 1), STATUS_RETRY_DELAY_MS);
          }
          return;
        }

        setState('failed');
        setErrorMessage('Your payment could not be confirmed at this time.');
      } catch {
        if (!cancelled) {
          if (attempt < MAX_STATUS_ATTEMPTS) {
            retryTimer = setTimeout(() => fetchOrder(attempt + 1), STATUS_RETRY_DELAY_MS);
          } else {
            setState('failed');
            setErrorMessage('A network error occurred. Please try refreshing the page.');
          }
        }
      }
    }

    fetchOrder();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [ref, sessionId]);

  if (state === 'loading') {
    return (
      <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <i className="ri-loader-4-line text-[#38E8C6] w-10 h-10 flex items-center justify-center animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-[#F5F7FA] mb-4">Checking your payment...</h1>
        <p className="text-[#AAB4C3]">Please wait while we confirm your payment status.</p>
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(139,108,255,0.1)] flex items-center justify-center mx-auto mb-6">
          <i className="ri-file-search-line text-[#8B6CFF] w-8 h-8 flex items-center justify-center" />
        </div>
        <h1 className="text-2xl font-bold text-[#F5F7FA] mb-4">Order not found</h1>
        <p className="text-[#AAB4C3] mb-8">
          This confirmation link is incomplete or no longer matches a checkout order. Please use the return link supplied by Stripe.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#38E8C6] text-[#0B0F14] font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(56,232,198,0.25)] transition-all"
        >
          Return to pricing
          <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
        </Link>
      </div>
    );
  }

  if (state === 'paid' && orderData) {
    return (
      <div className="max-w-3xl mx-auto pt-28 pb-20 px-6">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(56,232,198,0.12)] flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-double-line text-[#38E8C6] w-8 h-8 flex items-center justify-center" />
          </div>
          <p className="text-[#38E8C6] text-xs uppercase tracking-[0.14em] font-semibold mb-3">
            Payment Received
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F7FA] tracking-tight mb-4">
            Your project is officially underway.
          </h1>
          <p className="text-[#AAB4C3] max-w-lg mx-auto">
            We have received your starting payment and will be in touch shortly. A confirmation will be sent to the email address used at checkout.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.7)] p-6 lg:p-8 mb-8">
          <h2 className="text-lg font-semibold text-[#F5F7FA] mb-6">Order Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#AAB4C3]">Project reference</span>
              <span className="text-[#F5F7FA] font-mono font-semibold">{orderData.project_reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#AAB4C3]">Package</span>
              <span className="text-[#F5F7FA]">{orderData.package_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#AAB4C3]">Starting payment received</span>
              <span className="text-[#38E8C6] font-bold">{formatPriceMinor(orderData.starting_payment_minor)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#AAB4C3]">Remaining project balance</span>
              <span className="text-[#F5F7FA]">{formatPriceMinor(orderData.remaining_balance_minor)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.7)] p-6 lg:p-8 mb-8">
          <h2 className="text-lg font-semibold text-[#F5F7FA] mb-6">What happens next</h2>

          <div className="space-y-5">
            {[
              { step: 1, title: 'Confirmation email', desc: 'You will receive a confirmation email with your project reference and payment receipt.' },
              { step: 2, title: 'Discovery call', desc: 'We will arrange a discovery call to understand your goals, brand, and requirements in detail.' },
              { step: 3, title: 'Project scope confirmation', desc: 'A detailed scope document will be shared for your review and approval.' },
              { step: 4, title: 'Build schedule agreed', desc: 'We will confirm the build timeline and key milestones before work begins.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[rgba(56,232,198,0.12)] flex items-center justify-center shrink-0">
                  <span className="text-[#38E8C6] text-sm font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F7FA]">{item.title}</h3>
                  <p className="text-sm text-[#AAB4C3]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl border border-[rgba(148,163,184,0.25)] text-[#F5F7FA] font-semibold cursor-pointer hover:border-[#38E8C6]/40 hover:text-[#38E8C6] transition-all text-sm whitespace-nowrap"
          >
            Return to Digital Footprint
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'processing') {
    return (
      <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(56,232,198,0.1)] flex items-center justify-center mx-auto mb-6">
          <i className="ri-time-line text-[#38E8C6] w-8 h-8 flex items-center justify-center" />
        </div>
        <h1 className="text-2xl font-bold text-[#F5F7FA] mb-4">Your payment is still processing.</h1>
        <p className="text-[#AAB4C3] mb-8">
          We are checking for Stripe&apos;s confirmation automatically. This normally takes only a few moments.
        </p>
        <p className="text-sm text-[#64748B]">
          If you have not received confirmation within 30 minutes, please{' '}
          <Link href="/contact" className="text-[#38E8C6] hover:underline cursor-pointer">contact us</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.1)] flex items-center justify-center mx-auto mb-6">
        <i className="ri-close-circle-line text-[#EF4444] w-8 h-8 flex items-center justify-center" />
      </div>
      <h1 className="text-2xl font-bold text-[#F5F7FA] mb-4">We could not confirm the payment.</h1>
      <p className="text-[#AAB4C3] mb-8">
        {errorMessage || 'No payment has been confirmed for this order. Your selected package is still available.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl border border-[rgba(148,163,184,0.25)] text-[#F5F7FA] font-semibold cursor-pointer hover:border-[#38E8C6]/40 hover:text-[#38E8C6] transition-all text-sm whitespace-nowrap"
        >
          Return to checkout
          <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-[#38E8C6] text-[#0B0F14] font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(56,232,198,0.25)] transition-all text-sm whitespace-nowrap"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

export default function SuccessClient() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <i className="ri-loader-4-line text-[#38E8C6] w-10 h-10 flex items-center justify-center animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] mb-4">Loading...</h1>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
