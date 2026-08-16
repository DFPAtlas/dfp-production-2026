'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, ArrowRight, Save, Loader2, ChevronRight, ChevronLeft,
  AlertCircle, ShieldX, Lock, Check,
} from 'lucide-react';
import Link from 'next/link';
import StaffShell from '../../../../components/staff/StaffShell';
import StepProgress from '../../../../components/staff/wizard/StepProgress';
import Step1ClientDetails from '../../../../components/staff/wizard/Step1ClientDetails';
import Step2BusinessOverview from '../../../../components/staff/wizard/Step2BusinessOverview';
import Step3ServicesRequired from '../../../../components/staff/wizard/Step3ServicesRequired';
import Step4ProjectGoals from '../../../../components/staff/wizard/Step4ProjectGoals';
import Step5ProjectScope from '../../../../components/staff/wizard/Step5ProjectScope';
import Step6TechnicalRequirements from '../../../../components/staff/wizard/Step6TechnicalRequirements';
import Step7BudgetTimeline from '../../../../components/staff/wizard/Step7BudgetTimeline';
import Step8RoadmapOpportunities from '../../../../components/staff/wizard/Step8RoadmapOpportunities';
import Step9ReviewCreate from '../../../../components/staff/wizard/Step9ReviewCreate';
import { createEmptyWizardData, STEPS } from '@/lib/wizard-types';
import type { WizardData, ClientInfo, StaffInfo, ValidationError } from '@/lib/wizard-types';

export default function NewProjectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; role: string } | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [staff, setStaff] = useState<StaffInfo[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [urlClientId] = useState(() => searchParams.get('client') || '');

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [data, setData] = useState<WizardData>(createEmptyWizardData());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => { if (!cancelled) router.replace('/staff/login'); }, 0); return; }

      const { data: sp } = await supabase
        .from('staff_profiles')
        .select('id, full_name, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!sp) { setTimeout(() => { if (!cancelled) router.replace('/staff/login'); }, 0); return; }
      if (cancelled) return;

      const role = sp.role;
      const allowed = role === 'admin' || role === 'super_admin' || role === 'project_lead';

      if (!allowed) {
        setLoading(false);
        return;
      }

      setProfile(sp);
      setAuthorised(true);

      const [clientsRes, staffRes] = await Promise.all([
        supabase.from('clients').select('id, company_name, contact_name, email, phone, address, website, industry').order('company_name'),
        supabase.from('staff_profiles').select('id, full_name, role').order('full_name'),
      ]);

      if (cancelled) return;

      if (clientsRes.error) setLoadError(clientsRes.error.message);
      else setClients(clientsRes.data || []);

      if (staffRes.data) setStaff(staffRes.data);

      const prefillClientId = urlClientId;
      if (prefillClientId) {
        const matched = (clientsRes.data || []).find(c => c.id === prefillClientId);
        if (matched) {
          const leadId = searchParams.get('lead') || '';
          const leadService = searchParams.get('service') || '';
          setData(prev => ({
            ...prev,
            clientMode: 'existing',
            existingClientId: prefillClientId,
            services: leadService ? [leadService] : prev.services,
          }));
        }
      }

      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const refreshClients = useCallback(async () => {
    setClientsLoading(true);
    const { data: clientsRes } = await supabase.from('clients').select('id, company_name, contact_name, email, phone, address, website, industry').order('company_name');
    if (clientsRes) setClients(clientsRes);
    setClientsLoading(false);
  }, []);

  const validateStep = useCallback((step: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    switch (step) {
      case 1: {
        if (data.clientMode === 'existing' && !data.existingClientId) {
          errors.push({ field: 'existingClientId', message: 'Please select an existing client.' });
        }
        if (data.clientMode === 'new') {
          if (!data.newClient.company_name.trim()) errors.push({ field: 'company_name', message: 'Company name is required.' });
          if (!data.newClient.contact_name.trim()) errors.push({ field: 'contact_name', message: 'Contact name is required.' });
          if (!data.newClient.email.trim()) errors.push({ field: 'email', message: 'Email is required.' });
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.newClient.email.trim())) {
            errors.push({ field: 'email', message: 'Please enter a valid email address.' });
          }
        }
        break;
      }
      case 3: {
        if (data.services.length === 0) {
          errors.push({ field: 'services', message: 'At least one service must be selected.' });
        }
        break;
      }
      case 4: {
        if (!data.primaryGoal.trim()) {
          errors.push({ field: 'primaryGoal', message: 'A primary goal is required.' });
        }
        break;
      }
      case 7: {
        if (!data.projectName.trim()) {
          errors.push({ field: 'projectName', message: 'Project name is required.' });
        }
        if (!data.targetStart) {
          errors.push({ field: 'targetStart', message: 'Target start date is required.' });
        }
        if (!data.targetLaunch) {
          errors.push({ field: 'targetLaunch', message: 'Target launch date is required.' });
        }
        if (data.budgetAmount && isNaN(Number(data.budgetAmount))) {
          errors.push({ field: 'budgetAmount', message: 'Please enter a valid number.' });
        }
        if (data.targetStart && data.targetLaunch && data.targetLaunch < data.targetStart) {
          errors.push({ field: 'targetLaunch', message: 'Launch date must be after start date.' });
        }
        break;
      }
    }
    return errors;
  }, [data]);

  const handleNext = () => {
    const errors = validateStep(currentStep);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setTimeout(() => {
        if (formRef.current) {
          const firstError = formRef.current.querySelector('[data-error="true"]');
          if (firstError) (firstError as HTMLElement).focus();
        }
      }, 50);
      return;
    }
    setValidationErrors([]);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    setCurrentStep(prev => Math.min(prev + 1, 9));
  };

  const handleBack = () => {
    setValidationErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    setValidationErrors([]);
    setCurrentStep(step);
  };

  const handleCreate = async () => {
    const allErrors: ValidationError[] = [];
    for (let s = 1; s <= 9; s++) {
      allErrors.push(...validateStep(s));
    }
    setValidationErrors(allErrors);
    if (allErrors.length > 0) {
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }

    setCreating(true);
    setCreationError(null);

    const roadmapPayload = data.roadmapItems
      .filter(i => i.title.trim())
      .map(i => ({
        title: i.title.trim(),
        description: i.description.trim(),
        category: i.category,
        priority: i.priority,
        status: 'proposed',
        target_date: data.targetLaunch || null,
      }));

    const payload = {
      client_mode: data.clientMode,
      client_id: data.clientMode === 'existing' ? data.existingClientId : null,
      new_client: data.clientMode === 'new' ? {
        company_name: data.newClient.company_name.trim(),
        contact_name: data.newClient.contact_name.trim(),
        email: data.newClient.email.trim(),
        phone: data.newClient.phone.trim(),
        address: data.newClient.address.trim(),
        website: data.newClient.website.trim(),
        industry: data.newClient.industry,
      } : null,
      project: {
        name: data.projectName.trim(),
        description: data.descriptionSummary.trim() || data.businessOverview.trim().substring(0, 500),
        objective: data.primaryGoal.trim(),
        budget: Number(data.budgetAmount) || 0,
        start_date: data.targetStart,
        end_date: data.targetLaunch,
        project_lead: data.projectLead || null,
        priority: data.priorityLevel,
      },
      discovery: {
        business_overview: {
          overview: data.businessOverview.trim(),
          customers: data.targetCustomers.trim(),
          problem: data.problemStatement.trim(),
          systems: data.currentSystems.trim(),
          pain_points: data.painPoints.trim(),
        },
        services: data.services,
        goals: {
          primary: data.primaryGoal.trim(),
          success_definition: data.successDefinition.trim(),
          objectives: data.measurableOutcomes.filter(o => o.trim()),
        },
        scope: {
          deliverables: data.deliverables.filter(d => d.trim()),
          content_needs: data.contentNeeds.filter(c => c.trim()),
          integrations: data.integrationsList.filter(i => i.trim()),
          exclusions: data.exclusions.filter(e => e.trim()),
          user_roles: data.userRolesList.filter(r => r.trim()),
          dependencies: data.dependencies.trim(),
          notes: data.scopeNotes.trim(),
          admin_dashboard: data.adminDashboard,
          client_portal: data.clientPortal,
          payment_required: data.paymentRequired,
          email_required: data.emailRequired,
          file_upload_required: data.fileUploadRequired,
        },
        technical: {
          platform: data.platformStack.trim(),
          hosting: data.hostingProvider.trim(),
          domain: data.domainName.trim(),
          email: data.emailProvider.trim(),
          database: data.databaseType.trim(),
          integrations: data.existingIntegrations.trim(),
          auth: data.authRequired,
          migration: data.migrationRequired,
          accessibility: data.accessibilityWCAG,
          analytics: data.analyticsRequired,
          compliance: data.complianceNotes.trim(),
          security: data.securityNotes.trim(),
        },
        budget: {
          range: data.budgetRangeLabel,
          amount: data.budgetAmount,
          payment_plan: data.paymentPlan,
          start: data.targetStart,
          launch: data.targetLaunch,
          priority: data.priorityLevel,
        },
        roadmap_summary: roadmapPayload.length,
      },
      requirements: {
        required_pages: data.deliverables.filter(d => d.trim()),
        required_features: data.integrationsList.filter(i => i.trim()),
        integrations: data.integrationsList.filter(i => i.trim()),
        user_roles: data.userRolesList.filter(r => r.trim()),
        admin_dashboard: data.adminDashboard,
        client_portal: data.clientPortal,
        payment_required: data.paymentRequired,
        email_required: data.emailRequired,
        file_upload_required: data.fileUploadRequired,
      },
      roadmap: roadmapPayload,
    };

    const { data: result, error } = await supabase.rpc('create_project_with_discovery', { payload });

    if (error) {
      setCreationError(error.message);
      setCreating(false);
      return;
    }

    if (!result?.success) {
      setCreationError(result?.error || 'Unknown error creating project');
      setCreating(false);
      return;
    }

    setCreatedProjectId(result.project_id);
    setDirty(false);
    setCreating(false);
  };

  if (loading) {
    return (
      <StaffShell>
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/5 rounded w-40" />
              <div className="h-4 bg-white/5 rounded w-64" />
              <div className="h-64 bg-white/5 rounded-xl mt-6" />
            </div>
          </div>
        </div>
      </StaffShell>
    );
  }

  if (!authorised) {
    return (
      <StaffShell>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm mb-6">
            You do not have permission to create new projects. This feature is available to administrators and project leads.
          </p>
          <Link href="/staff/projects"
            className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Back to Projects
          </Link>
        </div>
      </StaffShell>
    );
  }

  if (createdProjectId) {
    return (
      <StaffShell>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#10B981]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Project Created</h1>
            <p className="text-slate-400 text-sm mb-2">
              The project, client profile, discovery data, requirements, and activity log have all been recorded.
            </p>
            <p className="text-xs text-slate-500 mb-6">A secure atomic transaction was used — no partial data was written.</p>
            <div className="flex gap-4 justify-center">
              <Link href={`/staff/projects/${createdProjectId}`}
                className="px-6 py-3 bg-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Open Project
              </Link>
              <Link href="/staff/projects"
                className="px-6 py-3 border border-[rgba(255,255,255,0.12)] rounded-xl font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
              >
                Back to Projects
              </Link>
            </div>
          </motion.div>
        </div>
      </StaffShell>
    );
  }

  const stepError = validationErrors.length > 0 ? validationErrors[0].message : null;

  return (
    <StaffShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/staff/projects"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer mb-3"
            onClick={(e) => { if (dirty) { e.preventDefault(); if (confirm('You have unsaved changes. Leave anyway?')) router.push('/staff/projects'); } }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <h1 className="text-2xl font-bold text-white">Create New Project</h1>
          <p className="text-sm text-slate-400 mt-0.5">Complete the discovery wizard to create a fully configured project.</p>
        </div>

        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep} of 9</span>
            <span className="text-white font-medium">{STEPS[currentStep - 1]?.title}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#06B6D4] rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 9) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="hidden lg:block w-[220px] shrink-0">
            <div className="sticky top-24 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
              <StepProgress
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl" ref={formRef}>
              <div className="p-6 lg:p-8">
                {stepError && (
                  <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepError}</span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    {currentStep === 1 && (
                      <Step1ClientDetails
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        validationErrors={validationErrors}
                        onRefreshClients={refreshClients}
                      />
                    )}
                    {currentStep === 2 && (
                      <Step2BusinessOverview
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 3 && (
                      <Step3ServicesRequired
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 4 && (
                      <Step4ProjectGoals
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 5 && (
                      <Step5ProjectScope
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 6 && (
                      <Step6TechnicalRequirements
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 7 && (
                      <Step7BudgetTimeline
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        staff={staff}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 8 && (
                      <Step8RoadmapOpportunities
                        data={data}
                        onChange={(d) => { setData(d); setDirty(true); }}
                        validationErrors={validationErrors}
                      />
                    )}
                    {currentStep === 9 && (
                      <Step9ReviewCreate
                        data={data}
                        clients={clients}
                        staff={staff}
                        validationErrors={validationErrors}
                        onEditStep={handleStepClick}
                        creating={creating}
                        onCreateProject={handleCreate}
                        creationError={creationError}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {currentStep < 9 && (
                <div className="flex items-center justify-between p-6 lg:px-8 border-t border-[rgba(255,255,255,0.06)]">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.12)] rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    Step {currentStep} of 9
                  </div>

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}