'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getPackageById,
  isValidPackageId,
  formatPriceShortMinor,
  type WebsitePackage,
} from '@/lib/website-packages';
import LeftPanel from './LeftPanel';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

type CheckoutStep = 'package' | 'details' | 'payment';

interface CustomerDetails {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  billingAddress: string;
  townCity: string;
  postcode: string;
  country: string;
  existingWebsite: string;
  projectDescription: string;
  preferredContact: string;
}

interface Confirmations {
  priceConfirmation: boolean;
  paymentSplit: boolean;
  separateQuotation: boolean;
  termsPrivacy: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

const initialDetails: CustomerDetails = {
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  billingAddress: '',
  townCity: '',
  postcode: '',
  country: 'GB',
  existingWebsite: '',
  projectDescription: '',
  preferredContact: 'email',
};

const initialConfirmations: Confirmations = {
  priceConfirmation: false,
  paymentSplit: false,
  separateQuotation: false,
  termsPrivacy: false,
};

const countryOptions = [
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IE', label: 'Ireland' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'PT', label: 'Portugal' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'SG', label: 'Singapore' },
];

function ProgressIndicator({ step }: { step: CheckoutStep }) {
  const steps: { key: CheckoutStep; label: string }[] = [
    { key: 'package', label: 'Package' },
    { key: 'details', label: 'Details' },
    { key: 'payment', label: 'Payment' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-[rgba(56,232,198,0.1)] border border-[#38E8C6] text-[#38E8C6]'
                  : isComplete
                    ? 'text-[#AAB4C3]'
                    : 'text-[#64748B]'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-[#38E8C6] text-[#0B0F14]'
                    : isComplete
                      ? 'bg-[rgba(56,232,198,0.2)] text-[#38E8C6]'
                      : 'bg-[rgba(148,163,184,0.12)] text-[#64748B]'
                }`}
              >
                {isComplete ? (
                  <i className="ri-check-line w-3 h-3 flex items-center justify-center" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px ${i < currentIndex ? 'bg-[#38E8C6]/40' : 'bg-[rgba(148,163,184,0.15)]'}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

function CompactOrderSummary({
  pkg,
  breakdownOpen,
  onToggle,
}: {
  pkg: WebsitePackage;
  breakdownOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.15)] bg-[rgba(17,24,39,0.6)] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(56,232,198,0.08)] flex items-center justify-center">
            <i className="ri-stack-line text-[#38E8C6] w-4 h-4 flex items-center justify-center" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F5F7FA]">{pkg.name} package</p>
            {pkg.badge && (
              <span className="inline-block px-1.5 py-0.5 rounded-full bg-[#38E8C6] text-[#0B0F14] text-[9px] font-bold uppercase tracking-wider mt-0.5">
                {pkg.badge}
              </span>
            )}
          </div>
        </div>
        <span className="text-lg font-bold text-[#38E8C6]">
          {formatPriceShortMinor(pkg.depositMinor)}
        </span>
      </div>

      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-[#38E8C6] hover:text-[#5EEDD4] cursor-pointer min-h-[40px] transition-colors"
        aria-expanded={breakdownOpen}
      >
        {breakdownOpen ? 'Hide' : 'View'} payment breakdown
        {breakdownOpen ? (
          <i className="ri-arrow-up-s-line w-3.5 h-3.5 flex items-center justify-center transition-transform" />
        ) : (
          <i className="ri-arrow-down-s-line w-3.5 h-3.5 flex items-center justify-center transition-transform" />
        )}
      </button>

      {breakdownOpen && (
        <div className="mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)] space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Full package price</span>
            <span className="text-[#F5F7FA] font-semibold">{formatPriceShortMinor(pkg.fullPriceMinor)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Design approval (30%)</span>
            <span className="text-[#AAB4C3]">{formatPriceShortMinor(pkg.secondMilestoneMinor)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Pre-launch (20%)</span>
            <span className="text-[#AAB4C3]">{formatPriceShortMinor(pkg.finalMilestoneMinor)}</span>
          </div>
          <p className="text-[10px] text-[#64748B] pt-1 leading-relaxed">
            Only the 50% starting payment is collected today.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-1 text-xs text-[#38E8C6] hover:underline cursor-pointer">
            Change package
          </Link>
        </div>
      )}
    </div>
  );
}

function PackageSelector() {
  const packages = [
    getPackageById('launch'),
    getPackageById('growth'),
    getPackageById('commerce'),
  ].filter(Boolean) as WebsitePackage[];

  return (
    <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 text-center">
      <p className="text-[#38E8C6] text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-4">
        Secure Project Checkout
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F5F7FA] tracking-tight mb-4">
        Start your Digital Footprint project.
      </h1>
      <p className="text-lg text-[#AAB4C3] max-w-xl mx-auto mb-12">
        Secure your build slot with a 50% starting payment. Select a package to continue.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/checkout?package=${pkg.id}`}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(56,232,198,0.12)] ${
              pkg.badge
                ? 'border-[#38E8C6] bg-[rgba(15,23,42,0.85)]'
                : 'border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.6)] hover:border-[rgba(148,163,184,0.35)]'
            }`}
          >
            {pkg.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#38E8C6] text-[#0B0F14] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                {pkg.badge}
              </span>
            )}
            <h3 className="text-lg font-bold text-[#F5F7FA] mb-1">{pkg.name}</h3>
            <div className="mb-2">
              <span className="text-sm text-[#AAB4C3]">From </span>
              <span className="text-2xl font-bold text-[#F5F7FA]">{formatPriceShortMinor(pkg.fullPriceMinor)}</span>
            </div>
            <p className="text-sm text-[#AAB4C3] mb-4">{pkg.description}</p>
            <ul className="space-y-1.5 flex-1 mb-6">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-[#AAB4C3]">
                  <i className="ri-check-line text-[#38E8C6] w-3.5 h-3.5 flex items-center justify-center shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[rgba(148,163,184,0.25)] text-sm font-semibold text-[#F5F7FA] bg-[rgba(15,23,42,0.4)] hover:border-[#38E8C6]/40 hover:text-[#38E8C6] hover:bg-[rgba(56,232,198,0.08)] transition-colors cursor-pointer">
              Select {pkg.name}
              <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-[#64748B]">
        Not sure which package is right?{' '}
        <Link href="/contact" className="text-[#38E8C6] hover:underline cursor-pointer">
          Talk to us
        </Link>
      </p>
    </div>
  );
}

function InvalidPackage() {
  return (
    <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(139,108,255,0.1)] flex items-center justify-center mx-auto mb-6">
        <i className="ri-error-warning-line text-[#8B6CFF] w-8 h-8 flex items-center justify-center" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-4">
        Package not recognised
      </h1>
      <p className="text-[#AAB4C3] mb-8">
        The selected package is not available. Please choose from our available website packages.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#38E8C6] text-[#0B0F14] font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(56,232,198,0.25)] transition-all"
      >
        View packages
        <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
      </Link>
    </div>
  );
}

function CheckoutForm() {
  return (
    <div className="min-h-[calc(100vh-80px)]">
      <CheckoutFormInner />
    </div>
  );
}

function CheckoutFormInner() {
  const searchParams = useSearchParams();
  const packageParam = searchParams.get('package') || '';

  const [step, setStep] = useState<CheckoutStep>('details');
  const [selectedPkg, setSelectedPkg] = useState<WebsitePackage | null>(null);
  const [details, setDetails] = useState<CustomerDetails>(initialDetails);
  const [confirmations, setConfirmations] = useState<Confirmations>(initialConfirmations);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [mobileBreakdownOpen, setMobileBreakdownOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!packageParam) return;
    if (!isValidPackageId(packageParam)) return;
    const pkg = getPackageById(packageParam);
    if (pkg) setSelectedPkg(pkg);
  }, [packageParam]);

  const validateField = useCallback(
    (name: string, value: string): string => {
      switch (name) {
        case 'fullName':
          return value.trim().length < 2 ? 'Full name is required' : '';
        case 'email':
          return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? 'A valid email address is required' : '';
        case 'billingAddress':
          return value.trim().length < 5 ? 'Billing address is required' : '';
        case 'phone':
          return '';
        case 'postcode':
          return '';
        default:
          return '';
      }
    },
    []
  );

  const validateAll = useCallback((): FieldErrors => {
    const newErrors: FieldErrors = {};
    const requiredFields: (keyof CustomerDetails)[] = ['fullName', 'email', 'billingAddress'];
    for (const field of requiredFields) {
      const err = validateField(field, details[field]);
      if (err) newErrors[field] = err;
    }
    if (!confirmations.priceConfirmation) newErrors.priceConfirmation = 'You must confirm the package price understanding.';
    if (!confirmations.paymentSplit) newErrors.paymentSplit = 'You must confirm you understand this covers the first 50%.';
    if (!confirmations.separateQuotation) newErrors.separateQuotation = 'You must acknowledge that additional features may require separate quotation.';
    if (!confirmations.termsPrivacy) newErrors.termsPrivacy = 'You must agree to the terms and privacy policy.';
    return newErrors;
  }, [details, confirmations, validateField]);

  const handleInputChange = useCallback((field: keyof CustomerDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      const err = validateField(field, value);
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
    setSubmitError('');
  }, [validateField]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError('');
      setStatusMessage('');

      const validationErrors = validateAll();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstErrorField = Object.keys(validationErrors)[0];
        const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
        el?.focus();
        return;
      }

      if (!selectedPkg) return;

      setIsSubmitting(true);
      setStatusMessage('Preparing your secure payment...');

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/dfp-website-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            package_id: selectedPkg.id,
            customer_name: details.fullName.trim(),
            customer_email: details.email.trim(),
            customer_phone: details.phone.trim(),
            business_name: details.businessName.trim(),
            billing_address: details.billingAddress.trim(),
            billing_postcode: details.postcode.trim(),
            billing_country: details.country,
            existing_website: details.existingWebsite.trim(),
            project_description: details.projectDescription.trim(),
            preferred_contact: details.preferredContact,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setSubmitError(data.error || 'Something went wrong. Please try again.');
          setIsSubmitting(false);
          setStatusMessage('');
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          setSubmitError('Could not start the payment session. Please try again.');
          setIsSubmitting(false);
          setStatusMessage('');
        }
      } catch {
        setSubmitError('A network error occurred. Please check your connection and try again.');
        setIsSubmitting(false);
        setStatusMessage('');
      }
    },
    [details, confirmations, selectedPkg, validateAll]
  );

  if (!packageParam) {
    return <PackageSelector />;
  }

  if (packageParam && !selectedPkg) {
    return <InvalidPackage />;
  }

  if (!selectedPkg) {
    return <PackageSelector />;
  }

  const inputClass = (fieldName?: string) =>
    `w-full px-4 py-3 rounded-xl border bg-[rgba(11,15,20,0.5)] text-[#F5F7FA] text-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#38E8C6]/30 transition-colors min-h-[48px] ${
      fieldName && errors[fieldName] ? 'border-[#EF4444]' : 'border-[rgba(148,163,184,0.18)]'
    }`;

  const labelClass = 'block text-sm font-medium text-[#AAB4C3] mb-1.5';

  const requiredAsterisk = <span className="text-[#F97316]"> *</span>;

  return (
    <>
      {/* --- Desktop split layout --- */}
      <div className="hidden lg:flex min-h-screen">
        <div className="w-[46%] shrink-0 border-r border-[rgba(148,163,184,0.08)] pt-20">
          <LeftPanel pkg={selectedPkg} />
        </div>

        <div className="w-[54%] bg-[#111827] overflow-y-auto">
          <div className="px-10 pt-20 pb-9 max-w-[620px]">
            <p className="text-[10px] sm:text-[11px] text-[#64748B] uppercase tracking-[0.18em] font-semibold mb-2">
              Secure Project Checkout
            </p>
            <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight mb-2">
              Let&apos;s get your project started.
            </h1>
            <p className="text-sm text-[#AAB4C3] mb-6">
              Enter your details and make the 50% starting payment to secure your Digital Footprint build slot.
            </p>

            <div className="mb-8">
              <ProgressIndicator step={step} />
            </div>

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              {/* Customer details */}
              <div className="mb-8">
                <h2 className="text-base font-semibold text-[#F5F7FA] mb-5 flex items-center gap-2">
                  <i className="ri-user-line w-4 h-4 flex items-center justify-center text-[#38E8C6]" />
                  Your details
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      Full name{requiredAsterisk}
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={details.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      className={inputClass('fullName')}
                      placeholder="Your full name"
                    />
                    {errors.fullName && (
                      <p id="fullName-error" className="mt-1 text-xs text-[#EF4444]" role="alert">{errors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="businessName" className={labelClass}>
                      Business name
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      autoComplete="organization"
                      value={details.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className={inputClass()}
                      placeholder="Your business (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email address{requiredAsterisk}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={details.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={inputClass('email')}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-xs text-[#EF4444]" role="alert">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Telephone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={details.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={inputClass()}
                      placeholder="+44 7..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="billingAddress" className={labelClass}>
                      Billing address{requiredAsterisk}
                    </label>
                    <input
                      id="billingAddress"
                      name="billingAddress"
                      type="text"
                      autoComplete="street-address"
                      value={details.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      aria-invalid={!!errors.billingAddress}
                      aria-describedby={errors.billingAddress ? 'billingAddress-error' : undefined}
                      className={inputClass('billingAddress')}
                      placeholder="Your billing address"
                    />
                    {errors.billingAddress && (
                      <p id="billingAddress-error" className="mt-1 text-xs text-[#EF4444]" role="alert">{errors.billingAddress}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="townCity" className={labelClass}>
                      Town or city
                    </label>
                    <input
                      id="townCity"
                      name="townCity"
                      type="text"
                      autoComplete="address-level2"
                      value={details.townCity}
                      onChange={(e) => handleInputChange('townCity', e.target.value)}
                      className={inputClass()}
                      placeholder="Town or city"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="postcode" className={labelClass}>
                      Postcode
                    </label>
                    <input
                      id="postcode"
                      name="postcode"
                      type="text"
                      autoComplete="postal-code"
                      value={details.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      className={inputClass()}
                      placeholder="Postcode"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className={labelClass}>
                      Country
                    </label>
                    <div className="relative">
                      <select
                        id="country"
                        name="country"
                        autoComplete="country-name"
                        value={details.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className={`${inputClass()} pr-8 appearance-none cursor-pointer`}
                      >
                        {countryOptions.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 flex items-center justify-center pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="existingWebsite" className={labelClass}>
                    Existing website URL
                  </label>
                  <input
                    id="existingWebsite"
                    name="existingWebsite"
                    type="url"
                    autoComplete="url"
                    value={details.existingWebsite}
                    onChange={(e) => handleInputChange('existingWebsite', e.target.value)}
                    className={inputClass()}
                    placeholder="https://..."
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="projectDescription" className={labelClass}>
                    Short project description
                  </label>
                  <textarea
                    id="projectDescription"
                    name="projectDescription"
                    value={details.projectDescription}
                    onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                    maxLength={500}
                    rows={3}
                    className={`${inputClass()} resize-none`}
                    placeholder="Tell us briefly about your project..."
                  />
                  <p className="mt-1 text-xs text-[#64748B] text-right">
                    {details.projectDescription.length}/500
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Preferred contact method</label>
                  <div className="flex gap-2">
                    {['email', 'phone', 'either'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handleInputChange('preferredContact', method)}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium min-h-[44px] cursor-pointer transition-colors border ${
                          details.preferredContact === method
                            ? 'border-[#38E8C6] text-[#38E8C6] bg-[rgba(56,232,198,0.06)]'
                            : 'border-[rgba(148,163,184,0.18)] text-[#AAB4C3] hover:border-[rgba(148,163,184,0.35)]'
                        }`}
                      >
                        {method === 'email' ? 'Email' : method === 'phone' ? 'Phone' : 'Either'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment section divider */}
              <div className="border-t border-[rgba(148,163,184,0.1)] pt-8 mb-8">
                <h2 className="text-base font-semibold text-[#F5F7FA] mb-2 flex items-center gap-2">
                  <i className="ri-bank-card-line w-4 h-4 flex items-center justify-center text-[#8B6CFF]" />
                  Payment details
                </h2>
                <p className="text-sm text-[#AAB4C3] mb-5">
                  Your card information is handled securely by Stripe and is never stored by Digital Footprint.
                </p>

                <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(11,15,20,0.4)] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(139,108,255,0.08)] flex items-center justify-center">
                      <i className="ri-shield-check-line text-[#8B6CFF] w-4 h-4 flex items-center justify-center" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F5F7FA]">Secure card payment</p>
                      <p className="text-xs text-[#64748B]">Powered by Stripe</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    You will be redirected to Stripe&apos;s secure checkout to complete your payment.
                  </p>
                </div>
              </div>

              {/* Confirmations */}
              <div className="mb-8">
                <div className="space-y-3">
                  <ConfirmationCheckbox
                    name="priceConfirmation"
                    checked={confirmations.priceConfirmation}
                    error={errors.priceConfirmation}
                    onChange={(v) => {
                      setConfirmations((p) => ({ ...p, priceConfirmation: v }));
                      setErrors((p) => { const n = { ...p }; delete n.priceConfirmation; return n; });
                    }}
                    label="I confirm that the package price is a starting price based on the included scope."
                  />
                  <ConfirmationCheckbox
                    name="paymentSplit"
                    checked={confirmations.paymentSplit}
                    error={errors.paymentSplit}
                    onChange={(v) => {
                      setConfirmations((p) => ({ ...p, paymentSplit: v }));
                      setErrors((p) => { const n = { ...p }; delete n.paymentSplit; return n; });
                    }}
                    label="I understand that this payment covers the first 50% of the project."
                  />
                  <ConfirmationCheckbox
                    name="separateQuotation"
                    checked={confirmations.separateQuotation}
                    error={errors.separateQuotation}
                    onChange={(v) => {
                      setConfirmations((p) => ({ ...p, separateQuotation: v }));
                      setErrors((p) => { const n = { ...p }; delete n.separateQuotation; return n; });
                    }}
                    label="I agree that additional features or integrations may require a separate quotation."
                  />
                  <ConfirmationCheckbox
                    name="termsPrivacy"
                    checked={confirmations.termsPrivacy}
                    error={errors.termsPrivacy}
                    onChange={(v) => {
                      setConfirmations((p) => ({ ...p, termsPrivacy: v }));
                      setErrors((p) => { const n = { ...p }; delete n.termsPrivacy; return n; });
                    }}
                    label={
                      <>
                        I agree to the{' '}
                        <Link href="/terms" className="text-[#38E8C6] hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer">terms</Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-[#38E8C6] hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer">privacy policy</Link>.
                      </>
                    }
                  />
                </div>
              </div>

              {/* Pay button */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] rounded-xl text-base font-bold transition-all duration-300 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38E8C6]/50 bg-[#38E8C6] text-[#0B0F14] shadow-[0_0_24px_rgba(56,232,198,0.2)] hover:shadow-[0_0_36px_rgba(56,232,198,0.35)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line w-5 h-5 flex items-center justify-center animate-spin" />
                      Processing secure payment...
                    </>
                  ) : (
                    <>
                      <i className="ri-lock-line w-4 h-4 flex items-center justify-center" />
                      Pay {formatPriceShortMinor(selectedPkg.depositMinor)} securely
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#64748B] flex items-center justify-center gap-1.5">
                  <i className="ri-shield-check-line w-3.5 h-3.5 flex items-center justify-center" />
                  Secure payment processed by Stripe
                </p>

                <p className="text-center text-xs text-[#64748B]">
                  You are paying the 50% starting payment only.
                </p>
              </div>

              {submitError && (
                <div className="mt-5 p-4 rounded-xl bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)]">
                  <p className="text-sm text-[#EF4444] flex items-start gap-2">
                    <i className="ri-error-warning-line w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" />
                    {submitError}
                  </p>
                </div>
              )}

              {statusMessage && !submitError && (
                <div
                  ref={statusRef}
                  role="status"
                  aria-live="polite"
                  className="mt-5 p-4 rounded-xl bg-[rgba(56,232,198,0.06)] border border-[rgba(56,232,198,0.18)]"
                >
                  <p className="text-sm text-[#38E8C6] flex items-center gap-2">
                    <i className="ri-information-line w-4 h-4 flex items-center justify-center shrink-0" />
                    {statusMessage}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* --- Mobile/Tablet single-column layout --- */}
      <div className="lg:hidden px-4 sm:px-6 pt-24 pb-16 max-w-[600px] mx-auto">
        <CompactOrderSummary
          pkg={selectedPkg}
          breakdownOpen={mobileBreakdownOpen}
          onToggle={() => setMobileBreakdownOpen(!mobileBreakdownOpen)}
        />

        <div className="mt-6">
          <p className="text-[10px] text-[#64748B] uppercase tracking-[0.18em] font-semibold mb-1.5">
            Secure Project Checkout
          </p>
          <h1 className="text-xl font-bold text-[#F5F7FA] tracking-tight mb-1.5">
            Let&apos;s get your project started.
          </h1>
          <p className="text-sm text-[#AAB4C3] mb-5">
            Enter your details and make the 50% starting payment to secure your Digital Footprint build slot.
          </p>

          <div className="mb-6">
            <ProgressIndicator step={step} />
          </div>

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
                <i className="ri-user-line w-4 h-4 flex items-center justify-center text-[#38E8C6]" />
                Your details
              </h2>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="m-fullName" className={labelClass}>
                    Full name{requiredAsterisk}
                  </label>
                  <input id="m-fullName" name="fullName" type="text" autoComplete="name" value={details.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'm-fullName-error' : undefined} className={inputClass('fullName')} placeholder="Your full name" />
                  {errors.fullName && <p id="m-fullName-error" className="mt-1 text-xs text-[#EF4444]" role="alert">{errors.fullName}</p>}
                </div>
                <div>
                  <label htmlFor="m-businessName" className={labelClass}>Business name</label>
                  <input id="m-businessName" name="businessName" type="text" autoComplete="organization" value={details.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} className={inputClass()} placeholder="Your business (optional)" />
                </div>
                <div>
                  <label htmlFor="m-email" className={labelClass}>Email address{requiredAsterisk}</label>
                  <input id="m-email" name="email" type="email" autoComplete="email" value={details.email} onChange={(e) => handleInputChange('email', e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'm-email-error' : undefined} className={inputClass('email')} placeholder="your@email.com" />
                  {errors.email && <p id="m-email-error" className="mt-1 text-xs text-[#EF4444]" role="alert">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="m-phone" className={labelClass}>Telephone</label>
                  <input id="m-phone" name="phone" type="tel" autoComplete="tel" value={details.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={inputClass()} placeholder="+44 7..." />
                </div>
                <div>
                  <label htmlFor="m-billingAddress" className={labelClass}>Billing address{requiredAsterisk}</label>
                  <input id="m-billingAddress" name="billingAddress" type="text" autoComplete="street-address" value={details.billingAddress} onChange={(e) => handleInputChange('billingAddress', e.target.value)} aria-invalid={!!errors.billingAddress} aria-describedby={errors.billingAddress ? 'm-billingAddress-error' : undefined} className={inputClass('billingAddress')} placeholder="Your billing address" />
                  {errors.billingAddress && <p id="m-billingAddress-error" className="mt-1 text-xs text-[#EF4444]" role="alert">{errors.billingAddress}</p>}
                </div>
                <div>
                  <label htmlFor="m-townCity" className={labelClass}>Town or city</label>
                  <input id="m-townCity" name="townCity" type="text" autoComplete="address-level2" value={details.townCity} onChange={(e) => handleInputChange('townCity', e.target.value)} className={inputClass()} placeholder="Town or city" />
                </div>
                <div>
                  <label htmlFor="m-postcode" className={labelClass}>Postcode</label>
                  <input id="m-postcode" name="postcode" type="text" autoComplete="postal-code" value={details.postcode} onChange={(e) => handleInputChange('postcode', e.target.value)} className={inputClass()} placeholder="Postcode" />
                </div>
                <div>
                  <label htmlFor="m-country" className={labelClass}>Country</label>
                  <div className="relative">
                    <select id="m-country" name="country" autoComplete="country-name" value={details.country} onChange={(e) => handleInputChange('country', e.target.value)} className={`${inputClass()} pr-8 appearance-none cursor-pointer`}>
                      {countryOptions.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 flex items-center justify-center pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="m-existingWebsite" className={labelClass}>Existing website URL</label>
                  <input id="m-existingWebsite" name="existingWebsite" type="url" autoComplete="url" value={details.existingWebsite} onChange={(e) => handleInputChange('existingWebsite', e.target.value)} className={inputClass()} placeholder="https://..." />
                </div>
                <div>
                  <label htmlFor="m-projectDescription" className={labelClass}>Short project description</label>
                  <textarea id="m-projectDescription" name="projectDescription" value={details.projectDescription} onChange={(e) => handleInputChange('projectDescription', e.target.value)} maxLength={500} rows={3} className={`${inputClass()} resize-none`} placeholder="Tell us briefly about your project..." />
                  <p className="mt-1 text-xs text-[#64748B] text-right">{details.projectDescription.length}/500</p>
                </div>
                <div>
                  <label className={labelClass}>Preferred contact method</label>
                  <div className="flex gap-2">
                    {['email', 'phone', 'either'].map((method) => (
                      <button key={method} type="button" onClick={() => handleInputChange('preferredContact', method)} className={`px-4 py-2.5 rounded-full text-sm font-medium min-h-[44px] cursor-pointer transition-colors border ${details.preferredContact === method ? 'border-[#38E8C6] text-[#38E8C6] bg-[rgba(56,232,198,0.06)]' : 'border-[rgba(148,163,184,0.18)] text-[#AAB4C3] hover:border-[rgba(148,163,184,0.35)]'}`}>{method === 'email' ? 'Email' : method === 'phone' ? 'Phone' : 'Either'}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[rgba(148,163,184,0.1)] pt-6 mb-6">
              <h2 className="text-sm font-semibold text-[#F5F7FA] mb-1.5 flex items-center gap-2">
                <i className="ri-bank-card-line w-4 h-4 flex items-center justify-center text-[#8B6CFF]" />
                Payment details
              </h2>
              <p className="text-xs text-[#AAB4C3] mb-4">
                Your card information is handled securely by Stripe and is never stored by Digital Footprint.
              </p>

              <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(11,15,20,0.4)] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(139,108,255,0.08)] flex items-center justify-center">
                    <i className="ri-shield-check-line text-[#8B6CFF] w-4 h-4 flex items-center justify-center" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F5F7FA]">Secure card payment</p>
                    <p className="text-xs text-[#64748B]">Powered by Stripe</p>
                  </div>
                </div>
                <p className="text-xs text-[#64748B]">
                  You will be redirected to Stripe&apos;s secure checkout to complete your payment.
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <ConfirmationCheckbox name="priceConfirmation" checked={confirmations.priceConfirmation} error={errors.priceConfirmation} onChange={(v) => { setConfirmations((p) => ({ ...p, priceConfirmation: v })); setErrors((p) => { const n = { ...p }; delete n.priceConfirmation; return n; }); }} label="I confirm that the package price is a starting price based on the included scope." />
              <ConfirmationCheckbox name="paymentSplit" checked={confirmations.paymentSplit} error={errors.paymentSplit} onChange={(v) => { setConfirmations((p) => ({ ...p, paymentSplit: v })); setErrors((p) => { const n = { ...p }; delete n.paymentSplit; return n; }); }} label="I understand that this payment covers the first 50% of the project." />
              <ConfirmationCheckbox name="separateQuotation" checked={confirmations.separateQuotation} error={errors.separateQuotation} onChange={(v) => { setConfirmations((p) => ({ ...p, separateQuotation: v })); setErrors((p) => { const n = { ...p }; delete n.separateQuotation; return n; }); }} label="I agree that additional features or integrations may require a separate quotation." />
              <ConfirmationCheckbox name="termsPrivacy" checked={confirmations.termsPrivacy} error={errors.termsPrivacy} onChange={(v) => { setConfirmations((p) => ({ ...p, termsPrivacy: v })); setErrors((p) => { const n = { ...p }; delete n.termsPrivacy; return n; }); }} label={<>I agree to the <Link href="/terms" className="text-[#38E8C6] hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer">terms</Link> and <Link href="/privacy" className="text-[#38E8C6] hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer">privacy policy</Link>.</>} />
            </div>

            <div className="space-y-3">
              <button type="submit" disabled={isSubmitting} className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] rounded-xl text-base font-bold transition-all duration-300 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38E8C6]/50 bg-[#38E8C6] text-[#0B0F14] shadow-[0_0_24px_rgba(56,232,198,0.2)] hover:shadow-[0_0_36px_rgba(56,232,198,0.35)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {isSubmitting ? (<><i className="ri-loader-4-line w-5 h-5 flex items-center justify-center animate-spin" />Processing secure payment...</>) : (<><i className="ri-lock-line w-4 h-4 flex items-center justify-center" />Pay {formatPriceShortMinor(selectedPkg.depositMinor)} securely</>)}
              </button>
              <p className="text-center text-xs text-[#64748B] flex items-center justify-center gap-1.5">
                <i className="ri-shield-check-line w-3.5 h-3.5 flex items-center justify-center" />
                Secure payment processed by Stripe
              </p>
              <p className="text-center text-xs text-[#64748B]">You are paying the 50% starting payment only.</p>
            </div>

            {submitError && (
              <div className="mt-5 p-4 rounded-xl bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)]">
                <p className="text-sm text-[#EF4444] flex items-start gap-2">
                  <i className="ri-error-warning-line w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" />
                  {submitError}
                </p>
              </div>
            )}
            {statusMessage && !submitError && (
              <div ref={statusRef} role="status" aria-live="polite" className="mt-5 p-4 rounded-xl bg-[rgba(56,232,198,0.06)] border border-[rgba(56,232,198,0.18)]">
                <p className="text-sm text-[#38E8C6] flex items-center gap-2">
                  <i className="ri-information-line w-4 h-4 flex items-center justify-center shrink-0" />
                  {statusMessage}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

function ConfirmationCheckbox({
  name,
  checked,
  error,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  error?: string;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
          checked
            ? 'border-[rgba(56,232,198,0.25)] bg-[rgba(56,232,198,0.03)]'
            : 'border-[rgba(148,163,184,0.12)] hover:border-[rgba(148,163,184,0.22)]'
        }`}
      >
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-[rgba(148,163,184,0.3)] bg-transparent text-[#38E8C6] focus:ring-[#38E8C6] cursor-pointer accent-[#38E8C6]"
        />
        <span className="text-sm text-[#AAB4C3]">{label}</span>
      </label>
      {error && (
        <p className="mt-1 text-xs text-[#EF4444] ml-10" role="alert">{error}</p>
      )}
    </div>
  );
}

export default function CheckoutClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 bg-[rgba(148,163,184,0.1)] rounded mx-auto" />
            <div className="h-10 w-80 bg-[rgba(148,163,184,0.1)] rounded mx-auto" />
            <div className="h-5 w-64 bg-[rgba(148,163,184,0.1)] rounded mx-auto" />
          </div>
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}