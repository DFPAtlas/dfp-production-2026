'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import {
  generateApplicationReference,
  ELIGIBILITY_CONFIRMATIONS,
  EXPERIENCE_LEVELS,
  DEVICE_OPTIONS,
  BROWSER_OPTIONS,
  INTERNET_OPTIONS,
  CAPABILITY_OPTIONS,
  TESTING_INTEREST_OPTIONS,
  AVAILABILITY_HOURS_OPTIONS,
  DAY_OPTIONS,
  TIME_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_CONFIRMATIONS,
  INDUSTRY_OPTIONS,
  EXPERIENCE_SOURCE_OPTIONS,
  CONFIDENCE_LEVELS,
  TEST_ENVIRONMENT_OPTIONS,
  TESTING_ACTIVITY_OPTIONS,
  TESTING_STRENGTH_OPTIONS,
  TESTING_LEVEL_OPTIONS,
  USER_PERSPECTIVE_OPTIONS,
  ACCESSIBILITY_CAPABILITY_OPTIONS,
  RESPONSE_SPEED_OPTIONS,
  COMMUNICATION_METHOD_OPTIONS,
  SESSION_LENGTH_OPTIONS,
  NOTICE_REQUIRED_OPTIONS,
  type WizardApplicationData,
  type IndustryExperience,
  type DeviceProfile,
  type PracticalBugReport,
} from '@/lib/uat-application-types';
import { generateMatchingTags, buildMatchingProfile } from '@/lib/uat-matching';
import { supabase } from '@/lib/supabase';
import { notifyLeadSubmission } from '@/lib/submit-enquiry';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  UserRound,
  MonitorSmartphone,
  Heart,
  WalletCards,
  ShieldCheck,
  Bug,
  SearchCheck,
  ClipboardList,
} from 'lucide-react';

const TOTAL_STEPS = 9;

const STEP_TITLES: Record<number, string> = {
  1: 'Welcome & Eligibility',
  2: 'Personal Details',
  3: 'Experience & Industry',
  4: 'Devices & Environment',
  5: 'Testing Skills',
  6: 'Interests & Perspectives',
  7: 'Availability & Communication',
  8: 'Payments & Tax',
  9: 'Review & Submit',
};

function generateRef(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-UAT-APP-${year}-${seq}`;
}

function makeDefaultData(): WizardApplicationData {
  return {
    legalName: '',
    displayName: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    townCity: '',
    county: '',
    country: 'United Kingdom',
    postcode: '',
    preferredContactMethod: 'Email',
    experienceLevel: '',
    hasTestedBefore: '',
    techConfidence: '',
    hasReportedBugs: '',
    relevantWorkArea: '',
    relevantExperienceText: '',
    motivation: '',
    industryExperience: [],
    industryOtherText: '',
    devices: [],
    browsers: [],
    internetConnection: [],
    capabilities: {},
    deviceProfiles: [],
    testEnvironments: [],
    deviceRestrictions: '',
    testingActivities: [],
    testerStrengths: [],
    preferredTestingLevel: '',
    practicalBugReport: { bugTitle: '', stepsToReproduce: '', expectedResult: '', actualResult: '', deviceBrowser: '', happenedAgain: '', additionalNotes: '' },
    testingInterests: [],
    userPerspectives: [],
    userPerspectiveOtherText: '',
    accessibilityInterest: '',
    accessibilityCapabilities: [],
    projectConflictStatus: '',
    projectConflictDetails: '',
    accessibilityTools: '',
    availabilityHours: '',
    availabilityDays: [],
    availabilityTimes: [],
    shortNoticeAvailable: '',
    comfortableUnfinished: '',
    responseSpeed: '',
    communicationMethods: [],
    comfortableCommunication: {},
    preferredSessionLength: '',
    noticeRequired: '',
    preferredPaymentMethod: '',
    paymentConfirmations: new Array(PAYMENT_CONFIRMATIONS.length).fill(false),
    eligibilityConfirmations: new Array(ELIGIBILITY_CONFIRMATIONS.length).fill(false),
  };
}

function TagButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
        selected
          ? 'bg-[#2878d0]/10 border border-[#2878d0]/30 text-[#2878d0] shadow-sm'
          : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-[#2878d0]/20 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#2878d0] to-[#789265] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-[#2878d0] whitespace-nowrap">{pct}%</span>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
              s < step ? 'bg-emerald-100 text-emerald-600' : s === step ? 'bg-[#2878d0] text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {s < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s}
          </div>
          {s < TOTAL_STEPS && <div className={`h-0.5 w-3 transition-colors ${s < step ? 'bg-emerald-200' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function ErrorSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4" role="alert">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <p className="text-sm font-bold text-red-700">{errors.length} {errors.length === 1 ? 'issue needs' : 'issues need'} attention</p>
      </div>
      <ul className="list-disc list-inside space-y-0.5">
        {errors.map((e, i) => <li key={i} className="text-xs text-red-600">{e}</li>)}
      </ul>
    </div>
  );
}

export default function UATApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardApplicationData>(makeDefaultData());
  const [errors, setErrors] = useState<string[]>([]);
  const [applicationRef, setApplicationRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('uat_application_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          setData((prev) => ({ ...prev, ...parsed.data }));
        }
        if (parsed.step) setStep(parsed.step);
        if (parsed.applicationRef) setApplicationRef(parsed.applicationRef);
      }
    } catch {}
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const autosave = useCallback((currentData: WizardApplicationData, currentStep: number) => {
    setSaving(true);
    try {
      const ref = applicationRef || generateRef();
      if (!applicationRef) setApplicationRef(ref);
      localStorage.setItem('uat_application_draft', JSON.stringify({
        data: currentData,
        step: currentStep,
        applicationRef: ref,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  }, [applicationRef]);

  const debouncedSave = useCallback((d: WizardApplicationData, s: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autosave(d, s), 800);
  }, [autosave]);

  const updateData = (partial: Partial<WizardApplicationData>) => {
    const next = { ...data, ...partial };
    setData(next);
    setErrors([]);
    debouncedSave(next, step);
  };

  const toggleArray = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item];

  const validateStep = (s: number): string[] => {
    const errs: string[] = [];
    switch (s) {
      case 1:
        if (!data.eligibilityConfirmations.every(Boolean)) errs.push('All eligibility confirmations are required');
        break;
      case 2:
        if (!data.legalName.trim()) errs.push('Full legal name is required');
        if (!data.email.trim()) errs.push('Email is required');
        if (!data.townCity.trim()) errs.push('Town or city is required');
        if (!data.country.trim()) errs.push('Country is required');
        break;
      case 3:
        if (!data.experienceLevel) errs.push('Experience level is required');
        if (!data.hasTestedBefore) errs.push('Please tell us if you have tested before');
        if (!data.techConfidence) errs.push('Please tell us your confidence level');
        if (!data.motivation.trim()) errs.push('Please tell us why you would like to become a tester');
        if (data.industryExperience.length === 0 && data.industryExperience.filter((ie) => ie.industry === 'No specialist industry experience').length === 0) {
          errs.push('Please select at least one industry or "No specialist industry experience"');
        }
        break;
      case 4:
        if (data.devices.length === 0) errs.push('Please select at least one device');
        if (data.browsers.length === 0) errs.push('Please select at least one browser');
        if (data.internetConnection.length === 0) errs.push('Please select at least one internet connection type');
        if (data.testEnvironments.length === 0) errs.push('Please select at least one test condition');
        break;
      case 5:
        if (data.testingActivities.length === 0) errs.push('Please select at least one testing activity');
        if (data.testerStrengths.length === 0) errs.push('Please select at least one strength');
        if (data.testerStrengths.length > 5) errs.push('Please select no more than 5 strengths');
        if (!data.preferredTestingLevel) errs.push('Please select a preferred testing level');
        if (!data.practicalBugReport.bugTitle.trim()) errs.push('Bug title is required');
        if (!data.practicalBugReport.stepsToReproduce.trim()) errs.push('Steps to reproduce are required');
        break;
      case 6:
        if (data.testingInterests.length === 0) errs.push('Please select at least one testing interest');
        if (!data.accessibilityInterest) errs.push('Please tell us about your accessibility testing interest');
        if (!data.projectConflictStatus) errs.push('Please answer the project conflict question');
        if ((data.projectConflictStatus === 'Yes' || data.projectConflictStatus === 'Unsure') && !data.projectConflictDetails.trim()) {
          errs.push('Please provide details about the potential conflict');
        }
        break;
      case 7:
        if (!data.availabilityHours) errs.push('Please select your availability');
        if (data.availabilityDays.length === 0) errs.push('Please select at least one day');
        if (!data.responseSpeed) errs.push('Please select your typical response speed');
        if (data.communicationMethods.length === 0) errs.push('Please select at least one communication method');
        break;
      case 8:
        if (!data.preferredPaymentMethod) errs.push('Please select a preferred payment method');
        if (!data.paymentConfirmations.every(Boolean)) errs.push('All payment confirmations are required');
        break;

    }
    return errs;
  };

  const formTopRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    const errs = validateStep(step);
    if (errs.length > 0) { setErrors(errs); return; }
    if (step < TOTAL_STEPS) {
      const ns = step + 1;
      setStep(ns);
      autosave(data, ns);
      requestAnimationFrame(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };
  const handleBack = () => { if (step > 1) { setStep(step - 1); setErrors([]); } };
  const handleSubmit = () => { const errs = validateStep(9); if (errs.length > 0) { setErrors(errs); return; } setShowConfirmModal(true); };



  const doSubmit = async () => {
    setShowConfirmModal(false); setSubmitting(true); setServerError('');
    try {
      const ref = applicationRef || generateRef();

      const honeypotEl = document.querySelector<HTMLInputElement>('#app_hp_field');
      if (honeypotEl && honeypotEl.value.trim()) {
        setServerError('');
        sessionStorage.setItem('uat_app_complete', JSON.stringify({ reference: ref, name: data.legalName.trim(), date: new Date().toISOString() }));
        router.replace('/uat-testing/application-complete');
        return;
      }

      const { data: insertedApp, error } = await supabase.from('uat_tester_applications').insert({
        application_reference: ref,
        legal_name: data.legalName.trim(),
        display_name: data.displayName.trim(),
        email: data.email.trim(),
        mobile: data.mobile.trim(),
        date_of_birth: data.dateOfBirth,
        town_city: data.townCity.trim(),
        county: data.county.trim(),
        country: data.country.trim(),
        postcode: data.postcode.trim(),
        preferred_contact_method: data.preferredContactMethod,
        experience_level: data.experienceLevel,
        has_tested_before: data.hasTestedBefore,
        tech_confidence: data.techConfidence,
        has_reported_bugs: data.hasReportedBugs,
        relevant_work_area: data.relevantWorkArea,
        relevant_experience_text: data.relevantExperienceText,
        motivation: data.motivation,
        industry_experience: data.industryExperience,
        industry_other_text: data.industryOtherText,
        devices: data.devices,
        browsers: data.browsers,
        internet_connection: data.internetConnection,
        capabilities: data.capabilities,
        device_profiles: data.deviceProfiles,
        test_environments: data.testEnvironments,
        device_restrictions: data.deviceRestrictions,
        testing_activities: data.testingActivities,
        tester_strengths: data.testerStrengths,
        preferred_testing_level: data.preferredTestingLevel,
        practical_bug_report: data.practicalBugReport,
        testing_interests: data.testingInterests,
        user_perspectives: data.userPerspectives,
        user_perspective_other_text: data.userPerspectiveOtherText,
        accessibility_interest: data.accessibilityInterest,
        accessibility_capabilities: data.accessibilityCapabilities,
        project_conflict_status: data.projectConflictStatus,
        project_conflict_details: data.projectConflictDetails,
        accessibility_tools: data.accessibilityTools,
        availability_hours: data.availabilityHours,
        availability_days: data.availabilityDays,
        availability_times: data.availabilityTimes,
        short_notice_available: data.shortNoticeAvailable,
        comfortable_unfinished: data.comfortableUnfinished,
        response_speed: data.responseSpeed,
        communication_methods: data.communicationMethods,
        comfortable_communication: data.comfortableCommunication,
        preferred_session_length: data.preferredSessionLength,
        notice_required: data.noticeRequired,
        preferred_payment_method: data.preferredPaymentMethod,
        payment_confirmations: data.paymentConfirmations,
        eligibility_confirmations: data.eligibilityConfirmations,
        matching_tags: generateMatchingTags(data),
        matching_profile: buildMatchingProfile(data),
        status: 'submitted',
      }).select('id');

      if (error) {
        setServerError(error.message || 'Submission failed. Please try again.');
        setSubmitting(false);
        return;
      }

      if (insertedApp?.[0]?.id) {
        notifyLeadSubmission('uat_tester_applications', insertedApp[0].id);
      }

      localStorage.removeItem('uat_application_draft');
      sessionStorage.setItem('uat_app_complete', JSON.stringify({ reference: ref, name: data.legalName.trim(), date: new Date().toISOString() }));
      router.replace('/uat-testing/application-complete');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  const goToStep = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
      setErrors([]);
      requestAnimationFrame(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };



  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#17325c]">
      <Header />
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <a href="/uat-testing" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2878d0] transition">
            <ArrowLeft className="h-4 w-4" /> Back to UAT
          </a>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
            {saving && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</span>}

          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <style>{`.app_field_wrap { position: absolute; left: -9999px; opacity: 0; height: 0; width: 0; overflow: hidden; }`}</style>
        <div className="app_field_wrap" aria-hidden="true">
          <input type="text" id="app_hp_field" name="website_alt" tabIndex={-1} autoComplete="off" readOnly />
        </div>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#789265] mb-2">Become a DFP UAT Tester</p>
          <h1 className="font-serif text-3xl font-semibold text-[#17325c]">Tester Application</h1>
          <p className="text-sm text-slate-500 mt-2">DFP UAT Testers help us test websites, applications and digital systems before they are released. Testers may receive payments or rewards for valid bugs and useful feedback.</p>
        </div>

        <div ref={formTopRef} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm mb-6">
          <StepIndicator step={step} />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Step {step} of {TOTAL_STEPS}</p>
              <p className="text-lg font-semibold text-[#17325c]">{STEP_TITLES[step]}</p>
            </div>
          </div>
          <div className="mt-3"><ProgressBar step={step} /></div>
        </div>

        <ErrorSummary errors={errors} />

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 1 && <Step1 data={data} updateData={updateData} />}
              {step === 2 && <Step2 data={data} updateData={updateData} />}
              {step === 3 && <Step3 data={data} updateData={updateData} />}
              {step === 4 && <Step4 data={data} updateData={updateData} />}
              {step === 5 && <Step5 data={data} updateData={updateData} />}
              {step === 6 && <Step6 data={data} updateData={updateData} />}
              {step === 7 && <Step7 data={data} updateData={updateData} />}
              {step === 8 && <Step8 data={data} updateData={updateData} />}
              {step === 9 && <Step9 data={data} step={step} goToStep={goToStep} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {serverError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={handleBack} disabled={step === 1 || submitting} className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${step === 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step === 1 && <button onClick={handleNext} className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-[#1e68b9] transition whitespace-nowrap">Start My Application <ArrowRight className="h-4 w-4" /></button>}
          {step > 1 && step < TOTAL_STEPS && <button onClick={handleNext} className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-[#1e68b9] transition whitespace-nowrap">Continue <ArrowRight className="h-4 w-4" /></button>}
          {step === TOTAL_STEPS && <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-[#1e68b9] transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <>Submit My Application</>}</button>}
        </div>

        {step >= 2 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => goToStep(s)} className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${s === step ? 'bg-[#2878d0]/10 text-[#2878d0]' : s < step ? 'text-slate-500 hover:text-[#2878d0] hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`} disabled={s > step}>
                {s < step ? <CheckCircle2 className="inline h-3 w-3 mr-0.5" /> : null}{s}
              </button>
            ))}
          </div>
        )}

        {step > 1 && step < TOTAL_STEPS && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="font-semibold text-sm text-[#17325c] mb-3">Review Your Progress</h3>
            <Step9 data={data} step={step} goToStep={goToStep} compact />
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-5 py-3">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} disabled={step === 1 || submitting} className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap ${step === 1 ? 'border-slate-100 text-slate-300' : 'border-slate-200 text-slate-600'}`}><ArrowLeft className="h-4 w-4" /> Back</button>
          <span className="text-xs font-medium text-slate-400">Step {step}/{TOTAL_STEPS}</span>
          {step === TOTAL_STEPS ? (
            <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2878d0] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 whitespace-nowrap">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}</button>
          ) : (
            <button onClick={handleNext} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2878d0] px-4 py-2.5 text-sm font-bold text-white whitespace-nowrap">{step === 1 ? 'Start' : 'Continue'} <ArrowRight className="h-4 w-4" /></button>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-semibold text-[#17325c] mb-3">Confirm Your Submission</h3>
            <p className="text-sm text-slate-600 mb-2">You are about to submit your application to become a DFP UAT Tester.</p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 space-y-1 mb-5">
              <p><strong>Name:</strong> {data.legalName.trim()}</p>
              <p><strong>Email:</strong> {data.email}</p>
              <p><strong>Application Reference:</strong> {applicationRef || '(new)'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition whitespace-nowrap">Go Back</button>
              <button onClick={doSubmit} className="flex-1 rounded-xl bg-[#2878d0] py-3 text-sm font-bold text-white hover:bg-[#1e68b9] transition whitespace-nowrap">Submit Application</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}

function Step1({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-2">Let&apos;s get to know you</h2>
      <p className="text-slate-500 text-sm mb-8">DFP UAT Testers help us test websites, applications and digital systems before they are released. Testers may receive payments or rewards for valid bugs and useful feedback.</p>
      <div className="space-y-4">
        {ELIGIBILITY_CONFIRMATIONS.map((text, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer rounded-lg bg-slate-50 p-4 transition hover:bg-sky-50">
            <input type="checkbox" checked={data.eligibilityConfirmations[i] || false} onChange={(e) => { const next = [...data.eligibilityConfirmations]; next[i] = e.target.checked; updateData({ eligibilityConfirmations: next }); }} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer" />
            <span className="text-sm font-medium text-slate-700">{text}</span>
          </label>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-4 p-4 rounded-xl bg-sky-50 border border-sky-100">
        <ShieldCheck className="h-8 w-8 text-[#2878d0] flex-shrink-0" />
        <div><p className="text-sm font-semibold text-[#17325c]">Your information is secure</p><p className="text-xs text-slate-500">All details are encrypted and used only for tester recruitment and project matching.</p></div>
      </div>
    </div>
  );
}

function Step2({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  const contactMethods = ['Email', 'Mobile', 'Either'];
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Personal Details</h2>
      <p className="text-slate-500 text-sm mb-8">Please provide your contact information so we can get in touch about your application.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Full Legal Name *</label><input type="text" value={data.legalName} onChange={(e) => updateData({ legalName: e.target.value })} placeholder="Jane Elizabeth Smith" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Preferred Display Name</label><input type="text" value={data.displayName} onChange={(e) => updateData({ displayName: e.target.value })} placeholder="Jane" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Email Address *</label><input type="email" name="email" value={data.email} onChange={(e) => updateData({ email: e.target.value })} placeholder="jane@example.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Mobile Number</label><input type="tel" value={data.mobile} onChange={(e) => updateData({ mobile: e.target.value })} placeholder="+44 7123 456789" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Date of Birth</label><input type="date" value={data.dateOfBirth} onChange={(e) => updateData({ dateOfBirth: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Town or City *</label><input type="text" value={data.townCity} onChange={(e) => updateData({ townCity: e.target.value })} placeholder="London" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">County</label><input type="text" value={data.county} onChange={(e) => updateData({ county: e.target.value })} placeholder="Greater London" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Country *</label><input type="text" value={data.country} onChange={(e) => updateData({ country: e.target.value })} placeholder="United Kingdom" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Postcode</label><input type="text" value={data.postcode} onChange={(e) => updateData({ postcode: e.target.value })} placeholder="SW1A 1AA" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
      </div>
      <div className="mt-5"><label className="block text-sm font-medium text-slate-600 mb-3">Preferred Contact Method</label><div className="flex flex-wrap gap-2">{contactMethods.map((m) => <TagButton key={m} label={m} selected={data.preferredContactMethod === m} onClick={() => updateData({ preferredContactMethod: m })} />)}</div></div>
    </div>
  );
}

function Step3({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  const yesNoOptions = ['Yes', 'No'];
  const confidenceLevels = ['Not very confident', 'Quite confident', 'Very confident'];
  const workAreas = ['Software', 'Design', 'Customer service', 'Administration', 'Accessibility', 'Security', 'Other', 'None'];

  const toggleIndustry = (industry: string) => {
    const existing = data.industryExperience.map((ie) => ie.industry);
    if (existing.includes(industry)) {
      updateData({ industryExperience: data.industryExperience.filter((ie) => ie.industry !== industry) });
    } else {
      if (industry === 'No specialist industry experience') {
        updateData({ industryExperience: [{ industry, source: '', confidence: '' }] });
      } else {
        const filtered = data.industryExperience.filter((ie) => ie.industry !== 'No specialist industry experience');
        updateData({ industryExperience: [...filtered, { industry, source: '', confidence: '' }] });
      }
    }
  };

  const updateIndustryField = (industryLabel: string, field: keyof IndustryExperience, value: string) => {
    updateData({
      industryExperience: data.industryExperience.map((ie) =>
        ie.industry === industryLabel ? { ...ie, [field]: value } : ie
      ),
    });
  };

  const hasGeneralIndustry = data.industryExperience.some((ie) => ie.industry === 'No specialist industry experience');
  const specificIndustries = data.industryExperience.filter((ie) => ie.industry !== 'No specialist industry experience');
  const hasNoExperience = data.industryExperience.length === 0;

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Experience & Industry Knowledge</h2>
      <p className="text-slate-500 text-sm mb-8">Beginners are welcome. Honest answers help us match you with suitable tests.</p>

      <div className="space-y-6">
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Have you tested a website or application before? *</label><div className="flex flex-wrap gap-2">{yesNoOptions.map((o) => <TagButton key={o} label={o} selected={data.hasTestedBefore === o} onClick={() => updateData({ hasTestedBefore: o })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">How confident are you using websites and apps? *</label><div className="flex flex-wrap gap-2">{confidenceLevels.map((c) => <TagButton key={c} label={c} selected={data.techConfidence === c} onClick={() => updateData({ techConfidence: c })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Have you reported bugs before? *</label><div className="flex flex-wrap gap-2">{yesNoOptions.map((o) => <TagButton key={o} label={o} selected={data.hasReportedBugs === o} onClick={() => updateData({ hasReportedBugs: o })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Have you worked in any of these areas?</label><div className="flex flex-wrap gap-2">{workAreas.map((w) => <TagButton key={w} label={w} selected={data.relevantWorkArea === w} onClick={() => updateData({ relevantWorkArea: data.relevantWorkArea === w ? '' : w })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Experience Level *</label><div className="flex flex-wrap gap-2">{EXPERIENCE_LEVELS.map((lvl) => <TagButton key={lvl} label={lvl} selected={data.experienceLevel === lvl} onClick={() => updateData({ experienceLevel: lvl })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Briefly describe any relevant experience</label><textarea value={data.relevantExperienceText} onChange={(e) => updateData({ relevantExperienceText: e.target.value })} rows={3} maxLength={500} placeholder="e.g. I have tested my own website, or I worked in retail and reported checkout issues..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition resize-none" /></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-1.5">Why would you like to become a DFP UAT Tester? *</label><textarea value={data.motivation} onChange={(e) => updateData({ motivation: e.target.value })} rows={4} maxLength={500} placeholder="Tell us why you are interested in testing..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition resize-none" /></div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">Industry Knowledge</h3>
          <p className="text-slate-500 text-sm mb-4">Which industries or areas do you understand or have experience with?</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {INDUSTRY_OPTIONS.map((ind) => (
              <TagButton key={ind} label={ind} selected={data.industryExperience.some((ie) => ie.industry === ind)} onClick={() => toggleIndustry(ind)} />
            ))}
          </div>

          {hasNoExperience && <p className="text-amber-600 text-xs bg-amber-50 rounded-lg p-3">Please select at least one industry, or choose &quot;No specialist industry experience&quot;.</p>}

          {data.industryExperience.some((ie) => ie.industry === 'Other') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Please specify other industry</label>
              <input type="text" value={data.industryOtherText} onChange={(e) => updateData({ industryOtherText: e.target.value })} placeholder="Describe your industry experience" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
            </div>
          )}

          {specificIndustries.map((ie) => (
            <div key={ie.industry} className="mb-5 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-sm font-semibold text-[#17325c] mb-3">{ie.industry}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">How was this experience gained?</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_SOURCE_OPTIONS.map((src) => (
                      <TagButton key={src} label={src} selected={ie.source === src} onClick={() => updateIndustryField(ie.industry, 'source', ie.source === src ? '' : src)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Confidence level</label>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_LEVELS.map((cl) => (
                      <TagButton key={cl} label={cl} selected={ie.confidence === cl} onClick={() => updateIndustryField(ie.industry, 'confidence', ie.confidence === cl ? '' : cl)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-400 mt-2">Formal qualifications are not required for any industry.</p>
        </div>
      </div>
    </div>
  );
}

function Step4({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  const toggleDevice = (deviceLabel: string) => {
    const has = data.devices.includes(deviceLabel);
    const newDevices = has ? data.devices.filter((d) => d !== deviceLabel) : [...data.devices, deviceLabel];
    const newProfiles = has
      ? data.deviceProfiles.filter((dp) => dp.deviceLabel !== deviceLabel)
      : [...data.deviceProfiles, { deviceLabel, manufacturer: '', model: '', osVersion: '', browser: '', browserVersion: '', screenSize: '', canInstallApps: '', ownership: '' }];
    updateData({ devices: newDevices, deviceProfiles: newProfiles });
  };

  const updateDeviceProfile = (deviceLabel: string, field: keyof DeviceProfile, value: string) => {
    updateData({
      deviceProfiles: data.deviceProfiles.map((dp) =>
        dp.deviceLabel === deviceLabel ? { ...dp, [field]: value } : dp
      ),
    });
  };

  const osOptions = [
    'Windows 11', 'Windows 10', 'macOS Sequoia', 'macOS Sonoma', 'iOS 18', 'iOS 17', 'iPadOS 18', 'iPadOS 17', 'Android 15', 'Android 14', 'Android 13', 'ChromeOS', 'Tizen', 'webOS', 'Other / Not sure',
  ];

  const ownershipOptions = ['Personal', 'Shared', 'Work-owned'];

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Devices & Test Environment</h2>
      <p className="text-slate-500 text-sm mb-8">Select the devices and conditions you can test under. You do not need to own every device.</p>

      <div className="space-y-6">
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Devices *</label><div className="flex flex-wrap gap-2">{DEVICE_OPTIONS.map((d) => <TagButton key={d} label={d} selected={data.devices.includes(d)} onClick={() => toggleDevice(d)} />)}</div></div>

        {data.deviceProfiles.filter((dp) => data.devices.includes(dp.deviceLabel)).length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-[#17325c] mb-3">Device Details (optional)</h3>
            {data.deviceProfiles.filter((dp) => data.devices.includes(dp.deviceLabel)).map((dp) => (
              <details key={dp.deviceLabel} className="mb-3 rounded-xl border border-slate-100 bg-slate-50 group">
                <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-[#17325c] flex items-center justify-between">
                  {dp.deviceLabel}
                  <span className="text-xs text-slate-400">{(dp.manufacturer || dp.osVersion) ? `${[dp.manufacturer, dp.osVersion].filter(Boolean).join(' — ')}` : 'Click to add details'}</span>
                </summary>
                <div className="px-5 pb-4 space-y-3">
                  <input type="text" value={dp.manufacturer} onChange={(e) => updateDeviceProfile(dp.deviceLabel, 'manufacturer', e.target.value)} placeholder="Manufacturer (e.g. Samsung, Apple, Dell)" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 transition" />
                  <input type="text" value={dp.model} onChange={(e) => updateDeviceProfile(dp.deviceLabel, 'model', e.target.value)} placeholder="Model (e.g. Galaxy S24, MacBook Pro)" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 transition" />
                  <div className="relative">
                    <input type="text" value={dp.osVersion} onChange={(e) => updateDeviceProfile(dp.deviceLabel, 'osVersion', e.target.value)} placeholder="OS & version" list={`os-datalist-${dp.deviceLabel}`} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 transition" />
                    <datalist id={`os-datalist-${dp.deviceLabel}`}>{osOptions.map((o) => <option key={o} value={o} />)}</datalist>
                  </div>
                  <input type="text" value={dp.browser} onChange={(e) => updateDeviceProfile(dp.deviceLabel, 'browser', e.target.value)} placeholder="Main browser" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 transition" />
                  <input type="text" value={dp.screenSize} onChange={(e) => updateDeviceProfile(dp.deviceLabel, 'screenSize', e.target.value)} placeholder="Approximate screen size (e.g. 6.1-inch, 15.6-inch)" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 transition" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Can install test apps?</label>
                      <div className="flex gap-1">{['Yes', 'No', 'Not sure'].map((o) => <TagButton key={o} label={o} selected={dp.canInstallApps === o} onClick={() => updateDeviceProfile(dp.deviceLabel, 'canInstallApps', dp.canInstallApps === o ? '' : o)} />)}</div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Ownership</label>
                      <div className="flex gap-1">{ownershipOptions.map((o) => <TagButton key={o} label={o} selected={dp.ownership === o} onClick={() => updateDeviceProfile(dp.deviceLabel, 'ownership', dp.ownership === o ? '' : o)} />)}</div>
                    </div>
                  </div>
                </div>
              </details>
            ))}
            <p className="text-[10px] text-slate-400 mt-1">Serial numbers, IMEI or MAC addresses are never collected.</p>
          </div>
        )}

        <div><label className="block text-sm font-medium text-slate-600 mb-3">Browsers *</label><div className="flex flex-wrap gap-2">{BROWSER_OPTIONS.map((b) => <TagButton key={b} label={b} selected={data.browsers.includes(b)} onClick={() => updateData({ browsers: data.browsers.includes(b) ? data.browsers.filter((a) => a !== b) : [...data.browsers, b] })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Internet Connection *</label><div className="flex flex-wrap gap-2">{INTERNET_OPTIONS.map((i) => <TagButton key={i} label={i} selected={data.internetConnection.includes(i)} onClick={() => updateData({ internetConnection: data.internetConnection.includes(i) ? data.internetConnection.filter((a) => a !== i) : [...data.internetConnection, i] })} />)}</div></div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">Which conditions can you test under? *</label>
          <div className="flex flex-wrap gap-2">
            {TEST_ENVIRONMENT_OPTIONS.map((env) => (
              <TagButton key={env} label={env} selected={data.testEnvironments.includes(env)} onClick={() => updateData({ testEnvironments: data.testEnvironments.includes(env) ? data.testEnvironments.filter((a) => a !== env) : [...data.testEnvironments, env] })} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">Are you comfortable with the following?</label>
          <div className="space-y-3">
            {CAPABILITY_OPTIONS.map((cap) => (
              <label key={cap.key} className="flex items-start gap-3 cursor-pointer rounded-lg bg-slate-50 p-3 transition hover:bg-sky-50">
                <input type="checkbox" checked={data.capabilities[cap.key] || false} onChange={(e) => { const next = { ...data.capabilities }; next[cap.key] = e.target.checked; updateData({ capabilities: next }); }} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer" />
                <span className="text-sm font-medium text-slate-700">{cap.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Any device or installation restrictions? (optional)</label>
          <input type="text" value={data.deviceRestrictions} onChange={(e) => updateData({ deviceRestrictions: e.target.value })} placeholder="e.g. work device with restricted app installation" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
        </div>

        {data.devices.length > 0 && (
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
            <p className="text-xs text-sky-700"><strong>Device summary:</strong> {data.devices.slice(0, 3).join(' + ')} {data.devices.length > 3 ? `+ ${data.devices.length - 3} more` : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Step5({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  const toggleStrength = (s: string) => {
    if (data.testerStrengths.includes(s)) { updateData({ testerStrengths: data.testerStrengths.filter((x) => x !== s) }); return; }
    if (data.testerStrengths.length >= 5) return;
    updateData({ testerStrengths: [...data.testerStrengths, s] });
  };

  const updateBugReport = (field: keyof PracticalBugReport, value: string) => {
    updateData({ practicalBugReport: { ...data.practicalBugReport, [field]: value } });
  };

  const yesNoOptions = ['Yes', 'No'];

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Testing Skills</h2>
      <p className="text-slate-500 text-sm mb-8">Help us understand your testing abilities and how you approach bug reporting.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">Which testing activities are you comfortable doing? *</label>
          <div className="flex flex-wrap gap-2">
            {TESTING_ACTIVITY_OPTIONS.map((act) => (
              <TagButton key={act} label={act} selected={data.testingActivities.includes(act)} onClick={() => updateData({ testingActivities: data.testingActivities.includes(act) ? data.testingActivities.filter((a) => a !== act) : [...data.testingActivities, act] })} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">What are your strongest testing qualities? (up to 5)</label>
          <p className="text-xs text-slate-400 mb-2">{data.testerStrengths.length}/5 selected</p>
          <div className="flex flex-wrap gap-2">
            {TESTING_STRENGTH_OPTIONS.map((s) => (
              <TagButton key={s} label={s} selected={data.testerStrengths.includes(s)} onClick={() => toggleStrength(s)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">What level of testing would you like? *</label>
          <div className="flex flex-wrap gap-2">
            {TESTING_LEVEL_OPTIONS.map((lvl) => (
              <TagButton key={lvl} label={lvl} selected={data.preferredTestingLevel === lvl} onClick={() => updateData({ preferredTestingLevel: lvl })} />
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3 flex items-center gap-2"><Bug className="h-5 w-5 text-[#2878d0]" /> Practical Bug Report</h3>
          <div className="mb-4 p-4 rounded-xl bg-sky-50 border border-sky-100">
            <p className="text-sm text-slate-700 font-medium">Scenario: You are completing a form. You press Submit, but nothing happens.</p>
            <p className="text-xs text-slate-500 mt-1">Describe how you would report this bug. Think about what information would help a developer fix it.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bug Title *</label>
              <input type="text" value={data.practicalBugReport.bugTitle} onChange={(e) => updateBugReport('bugTitle', e.target.value)} placeholder="e.g. Submit button unresponsive on contact form" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Steps to Reproduce *</label>
              <textarea value={data.practicalBugReport.stepsToReproduce} onChange={(e) => updateBugReport('stepsToReproduce', e.target.value)} rows={3} maxLength={500} placeholder="1. Open the form page&#10;2. Fill in all required fields&#10;3. Click Submit" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expected Result</label>
              <input type="text" value={data.practicalBugReport.expectedResult} onChange={(e) => updateBugReport('expectedResult', e.target.value)} placeholder="e.g. Form submits and success message appears" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Result</label>
              <input type="text" value={data.practicalBugReport.actualResult} onChange={(e) => updateBugReport('actualResult', e.target.value)} placeholder="e.g. Nothing happens — no error, no response" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Device and Browser</label>
              <input type="text" value={data.practicalBugReport.deviceBrowser} onChange={(e) => updateBugReport('deviceBrowser', e.target.value)} placeholder="e.g. Windows 11 + Chrome" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Did it happen again after refreshing?</label>
              <div className="flex gap-2">{yesNoOptions.map((o) => <TagButton key={o} label={o} selected={data.practicalBugReport.happenedAgain === o} onClick={() => updateBugReport('happenedAgain', data.practicalBugReport.happenedAgain === o ? '' : o)} />)}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes or Evidence</label>
              <textarea value={data.practicalBugReport.additionalNotes} onChange={(e) => updateBugReport('additionalNotes', e.target.value)} rows={2} maxLength={500} placeholder="Any console errors, screenshots reference, or extra context..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition resize-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step6({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  const yesNoUnsure = ['Yes', 'Maybe, with training', 'No'];
  const conflictOptions = ['No', 'Yes', 'Unsure'];

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Interests & User Perspectives</h2>
      <p className="text-slate-500 text-sm mb-8">Select the types of testing that interest you and the perspectives you can bring.</p>

      <div className="space-y-6">
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Testing Interests *</label><div className="flex flex-wrap gap-2">{TESTING_INTEREST_OPTIONS.map((ti) => <TagButton key={ti} label={ti} selected={data.testingInterests.includes(ti)} onClick={() => updateData({ testingInterests: data.testingInterests.includes(ti) ? data.testingInterests.filter((a) => a !== ti) : [...data.testingInterests, ti] })} />)}</div></div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">User Perspectives</h3>
          <p className="text-slate-500 text-sm mb-3">Which real-world experiences can you help represent in testing?</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {USER_PERSPECTIVE_OPTIONS.map((up) => (
              <TagButton key={up} label={up} selected={data.userPerspectives.includes(up)} onClick={() => updateData({ userPerspectives: data.userPerspectives.includes(up) ? data.userPerspectives.filter((a) => a !== up) : [...data.userPerspectives, up] })} />
            ))}
          </div>
          {data.userPerspectives.includes('Other') && (
            <div className="mb-4"><label className="block text-xs font-medium text-slate-600 mb-1">Please specify</label><input type="text" value={data.userPerspectiveOtherText} onChange={(e) => updateData({ userPerspectiveOtherText: e.target.value })} placeholder="Describe your perspective..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" /></div>
          )}
          <p className="text-xs text-slate-400">These are framed as experience, not identity verification. No sensitive personal details are required.</p>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">Accessibility Testing</h3>
          <p className="text-slate-500 text-sm mb-3">Would you like to take part in accessibility testing? *</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {yesNoUnsure.map((o) => <TagButton key={o} label={o} selected={data.accessibilityInterest === o} onClick={() => {
              updateData({ accessibilityInterest: o });
              if (o === 'No') updateData({ accessibilityCapabilities: [], accessibilityTools: '' });
            }} />)}
          </div>
          {(data.accessibilityInterest === 'Yes' || data.accessibilityInterest === 'Maybe, with training') && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <label className="block text-xs font-medium text-slate-600">Which areas are relevant? (optional)</label>
              <div className="flex flex-wrap gap-2">
                {ACCESSIBILITY_CAPABILITY_OPTIONS.map((ac) => (
                  <TagButton key={ac} label={ac} selected={data.accessibilityCapabilities.includes(ac)} onClick={() => updateData({ accessibilityCapabilities: data.accessibilityCapabilities.includes(ac) ? data.accessibilityCapabilities.filter((a) => a !== ac) : [...data.accessibilityCapabilities, ac] })} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">You are not required to disclose any disability or medical condition.</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">Are there any accessibility tools or assistive technologies you use?</h3>
          <input type="text" value={data.accessibilityTools} onChange={(e) => updateData({ accessibilityTools: e.target.value })} placeholder="e.g. screen reader, magnifier, voice control..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition" />
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">Project Conflicts</h3>
          <p className="text-slate-500 text-sm mb-3">Are you working for, advising or testing for an organisation that could compete with a DFP project? *</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {conflictOptions.map((o) => <TagButton key={o} label={o} selected={data.projectConflictStatus === o} onClick={() => {
              updateData({ projectConflictStatus: o });
              if (o === 'No') updateData({ projectConflictDetails: '' });
            }} />)}
          </div>
          {(data.projectConflictStatus === 'Yes' || data.projectConflictStatus === 'Unsure') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Please provide details *</label>
              <textarea value={data.projectConflictDetails} onChange={(e) => updateData({ projectConflictDetails: e.target.value })} rows={3} maxLength={500} placeholder="Describe the potential conflict..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition resize-none" />
              <p className="text-xs text-slate-400 mt-1">This does not automatically reject your application. It flags for staff review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step7({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  const yesNoOptions = ['Yes', 'No'];

  const toggleComfortable = (key: string) => {
    updateData({ comfortableCommunication: { ...data.comfortableCommunication, [key]: !data.comfortableCommunication[key] } });
  };

  const comfortItems = [
    { key: 'detailed_instructions', label: 'Detailed written instructions' },
    { key: 'occasional_calls', label: 'Occasional calls' },
    { key: 'voice_feedback', label: 'Voice feedback' },
    { key: 'screen_recording', label: 'Screen recording' },
    { key: 'short_notice', label: 'Short-notice invitations' },
    { key: 'repeat_testing', label: 'Repeat testing after fixes' },
  ];

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Availability & Communication</h2>
      <p className="text-slate-500 text-sm mb-8">Availability does not guarantee work, DFP does not guarantee minimum tests, and you may decline individual invitations.</p>

      <div className="space-y-6">
        <div><label className="block text-sm font-medium text-slate-600 mb-3">How many hours are you normally available each week? *</label><div className="flex flex-wrap gap-2">{AVAILABILITY_HOURS_OPTIONS.map((h) => <TagButton key={h} label={h} selected={data.availabilityHours === h} onClick={() => updateData({ availabilityHours: h })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Which days are normally suitable? *</label><div className="flex flex-wrap gap-2">{DAY_OPTIONS.map((d) => <TagButton key={d} label={d} selected={data.availabilityDays.includes(d)} onClick={() => updateData({ availabilityDays: data.availabilityDays.includes(d) ? data.availabilityDays.filter((a) => a !== d) : [...data.availabilityDays, d] })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Preferred testing times</label><div className="flex flex-wrap gap-2">{TIME_OPTIONS.map((t) => <TagButton key={t} label={t} selected={data.availabilityTimes.includes(t)} onClick={() => updateData({ availabilityTimes: data.availabilityTimes.includes(t) ? data.availabilityTimes.filter((a) => a !== t) : [...data.availabilityTimes, t] })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Are you available for short-notice tests?</label><div className="flex flex-wrap gap-2">{yesNoOptions.map((o) => <TagButton key={o} label={o} selected={data.shortNoticeAvailable === o} onClick={() => updateData({ shortNoticeAvailable: o })} />)}</div></div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Are you comfortable testing unfinished products that may contain errors?</label><div className="flex flex-wrap gap-2">{yesNoOptions.map((o) => <TagButton key={o} label={o} selected={data.comfortableUnfinished === o} onClick={() => updateData({ comfortableUnfinished: o })} />)}</div></div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">Response & Communication</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-3">How quickly do you normally respond to a testing invitation? *</label><div className="flex flex-wrap gap-2">{RESPONSE_SPEED_OPTIONS.map((rs) => <TagButton key={rs} label={rs} selected={data.responseSpeed === rs} onClick={() => updateData({ responseSpeed: rs })} />)}</div></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-3">Suitable communication methods *</label><div className="flex flex-wrap gap-2">{COMMUNICATION_METHOD_OPTIONS.map((cm) => <TagButton key={cm} label={cm} selected={data.communicationMethods.includes(cm)} onClick={() => updateData({ communicationMethods: data.communicationMethods.includes(cm) ? data.communicationMethods.filter((a) => a !== cm) : [...data.communicationMethods, cm] })} />)}</div></div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-3">Are you comfortable with?</label>
              <div className="space-y-2.5">
                {comfortItems.map((ci) => (
                  <label key={ci.key} className="flex items-center gap-3 cursor-pointer rounded-lg bg-slate-50 p-3 transition hover:bg-sky-50">
                    <input type="checkbox" checked={data.comfortableCommunication[ci.key] || false} onChange={() => toggleComfortable(ci.key)} className="h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer" />
                    <span className="text-sm text-slate-700">{ci.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-slate-600 mb-3">Preferred session length</label><div className="flex flex-wrap gap-2">{SESSION_LENGTH_OPTIONS.map((sl) => <TagButton key={sl} label={sl} selected={data.preferredSessionLength === sl} onClick={() => updateData({ preferredSessionLength: sl })} />)}</div></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-3">Notice required</label><div className="flex flex-wrap gap-2">{NOTICE_REQUIRED_OPTIONS.map((nr) => <TagButton key={nr} label={nr} selected={data.noticeRequired === nr} onClick={() => updateData({ noticeRequired: nr })} />)}</div></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-700"><strong>Please note:</strong> Stated availability does not create guaranteed working hours. Test opportunities may vary.</p>
        </div>
      </div>
    </div>
  );
}

function Step8({ data, updateData }: { data: WizardApplicationData; updateData: (d: Partial<WizardApplicationData>) => void }) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Payments and your responsibilities</h2>
      <p className="text-slate-500 text-sm mb-8">Some DFP tests may offer a fixed payment, reward or bug bounty. Each opportunity will explain the payment rules before you accept it. Submitting a report does not automatically guarantee payment.</p>
      <div className="space-y-6">
        <div className="space-y-3">
          {PAYMENT_CONFIRMATIONS.map((text, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer rounded-lg bg-slate-50 p-4 transition hover:bg-sky-50">
              <input type="checkbox" checked={data.paymentConfirmations[i] || false} onChange={(e) => { const next = [...data.paymentConfirmations]; next[i] = e.target.checked; updateData({ paymentConfirmations: next }); }} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer" />
              <span className="text-sm font-medium text-slate-700">{text}</span>
            </label>
          ))}
        </div>
        <div><label className="block text-sm font-medium text-slate-600 mb-3">Preferred Payment Method *</label><p className="text-xs text-slate-400 mb-3">Sensitive payment details will only be collected securely after your application is approved.</p><div className="flex flex-wrap gap-2">{PAYMENT_METHOD_OPTIONS.map((pm) => <TagButton key={pm} label={pm} selected={data.preferredPaymentMethod === pm} onClick={() => updateData({ preferredPaymentMethod: pm })} />)}</div></div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <WalletCards className="h-5 w-5 text-amber-600 mb-2" />
          <p className="text-xs text-amber-700"><strong>Important:</strong> You are responsible for declaring and paying your own tax, National Insurance and VAT where applicable. DFP is not responsible for your personal tax return, tax payments, penalties, interest or accounting costs unless the law places responsibility on DFP.</p>
        </div>
      </div>
    </div>
  );
}

function Step9({ data, step, goToStep, compact }: { data: WizardApplicationData; step: number; goToStep: (s: number) => void; compact?: boolean }) {
  const ReviewRow = ({ label, value, editStep }: { label: string; value: string; editStep: number }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700 truncate max-w-[220px]">{value}</span>
        {!compact && editStep < step && (
          <button onClick={() => goToStep(editStep)} className="text-xs text-[#2878d0] hover:underline font-medium whitespace-nowrap cursor-pointer">Edit</button>
        )}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-1">
        <ReviewRow label="Name" value={data.legalName || '—'} editStep={2} />
        <ReviewRow label="Email" value={data.email || '—'} editStep={2} />
        <ReviewRow label="Experience" value={data.experienceLevel || '—'} editStep={3} />
        <ReviewRow label="Industries" value={data.industryExperience.length > 0 ? `${data.industryExperience.length} selected` : '—'} editStep={3} />
        <ReviewRow label="Devices" value={data.devices.length > 0 ? `${data.devices.length} selected` : '—'} editStep={4} />
        <ReviewRow label="Browsers" value={data.browsers.length > 0 ? `${data.browsers.length} selected` : '—'} editStep={4} />
        <ReviewRow label="Skills" value={data.testingActivities.length > 0 ? `${data.testingActivities.length} selected` : '—'} editStep={5} />
        <ReviewRow label="Bug Report" value={data.practicalBugReport.bugTitle ? 'Completed' : '—'} editStep={5} />
        <ReviewRow label="Interests" value={data.testingInterests.length > 0 ? `${data.testingInterests.length} selected` : '—'} editStep={6} />
        <ReviewRow label="Perspectives" value={data.userPerspectives.length > 0 ? `${data.userPerspectives.length} selected` : '—'} editStep={6} />
        <ReviewRow label="Accessibility" value={data.accessibilityInterest || '—'} editStep={6} />
        <ReviewRow label="Availability" value={data.availabilityHours || '—'} editStep={7} />
        <ReviewRow label="Communication" value={data.communicationMethods.join(', ') || '—'} editStep={7} />
        <ReviewRow label="Payment" value={data.preferredPaymentMethod || '—'} editStep={8} />
        <ReviewRow label="Conflict" value={data.projectConflictStatus || '—'} editStep={6} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#17325c] mb-1">Review Your Application</h2>
      <p className="text-slate-500 text-sm mb-6">Review your answers before submitting. Click Edit to return to any step.</p>

      <div className="space-y-5">
        <ReviewSection title="Personal Details" editStep={2} step={step} goToStep={goToStep}>
          <ReviewRow label="Legal Name" value={data.legalName || '—'} editStep={2} />
          <ReviewRow label="Display Name" value={data.displayName || '—'} editStep={2} />
          <ReviewRow label="Email" value={data.email || '—'} editStep={2} />
          <ReviewRow label="Mobile" value={data.mobile || '—'} editStep={2} />
          <ReviewRow label="Location" value={[data.townCity, data.county, data.postcode].filter(Boolean).join(', ') || data.country} editStep={2} />
        </ReviewSection>

        <ReviewSection title="Experience & Industry" editStep={3} step={step} goToStep={goToStep}>
          <ReviewRow label="Level" value={data.experienceLevel || '—'} editStep={3} />
          <ReviewRow label="Tested Before" value={data.hasTestedBefore || '—'} editStep={3} />
          <ReviewRow label="Confidence" value={data.techConfidence || '—'} editStep={3} />
          <ReviewRow label="Industries" value={data.industryExperience.filter((ie) => ie.industry !== 'No specialist industry experience').map((ie) => ie.industry).join(', ') || data.industryExperience.map((ie) => ie.industry).join(', ') || '—'} editStep={3} />
          <ReviewRow label="Motivation" value={data.motivation ? data.motivation.slice(0, 80) + (data.motivation.length > 80 ? '...' : '') : '—'} editStep={3} />
        </ReviewSection>

        <ReviewSection title="Devices & Environment" editStep={4} step={step} goToStep={goToStep}>
          <ReviewRow label="Devices" value={data.devices.join(', ') || '—'} editStep={4} />
          <ReviewRow label="Browsers" value={data.browsers.join(', ') || '—'} editStep={4} />
          <ReviewRow label="Internet" value={data.internetConnection.join(', ') || '—'} editStep={4} />
          <ReviewRow label="Test Conditions" value={data.testEnvironments.length > 0 ? `${data.testEnvironments.length} selected` : '—'} editStep={4} />
        </ReviewSection>

        <ReviewSection title="Testing Skills" editStep={5} step={step} goToStep={goToStep}>
          <ReviewRow label="Activities" value={data.testingActivities.length > 0 ? `${data.testingActivities.length} selected` : '—'} editStep={5} />
          <ReviewRow label="Strengths" value={data.testerStrengths.join(', ') || '—'} editStep={5} />
          <ReviewRow label="Level" value={data.preferredTestingLevel || '—'} editStep={5} />
          <ReviewRow label="Bug Report" value={data.practicalBugReport.bugTitle ? 'Completed' : '—'} editStep={5} />
        </ReviewSection>

        <ReviewSection title="Interests & Perspectives" editStep={6} step={step} goToStep={goToStep}>
          <ReviewRow label="Interests" value={data.testingInterests.length > 0 ? `${data.testingInterests.length} selected` : '—'} editStep={6} />
          <ReviewRow label="Perspectives" value={data.userPerspectives.join(', ') || '—'} editStep={6} />
          <ReviewRow label="Accessibility" value={data.accessibilityInterest || '—'} editStep={6} />
          <ReviewRow label="Conflicts" value={data.projectConflictStatus || '—'} editStep={6} />
        </ReviewSection>

        <ReviewSection title="Availability & Communication" editStep={7} step={step} goToStep={goToStep}>
          <ReviewRow label="Hours" value={data.availabilityHours || '—'} editStep={7} />
          <ReviewRow label="Days" value={data.availabilityDays.join(', ') || '—'} editStep={7} />
          <ReviewRow label="Response" value={data.responseSpeed || '—'} editStep={7} />
          <ReviewRow label="Methods" value={data.communicationMethods.join(', ') || '—'} editStep={7} />
        </ReviewSection>

        <ReviewSection title="Payment" editStep={8} step={step} goToStep={goToStep}>
          <ReviewRow label="Method" value={data.preferredPaymentMethod || '—'} editStep={8} />
        </ReviewSection>
      </div>
    </div>
  );
}

function ReviewSection({ title, children, editStep, step, goToStep }: { title: string; children: React.ReactNode; editStep: number; step: number; goToStep: (s: number) => void }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#17325c]">{title}</h3>
        {editStep < step && (
          <button onClick={() => goToStep(editStep)} className="text-xs text-[#2878d0] hover:underline font-medium cursor-pointer">Edit</button>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}