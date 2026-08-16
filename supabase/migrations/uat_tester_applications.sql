-- UAT Tester Applications Wizard System
-- Creates applications table with RLS, save-and-resume support

create table if not exists public.uat_tester_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_reference text not null unique,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'under_review', 'more_information_required', 'approved', 'declined', 'waitlisted', 'suspended', 'closed')),
  legal_name text,
  display_name text,
  email text not null,
  mobile text,
  date_of_birth text,
  town_city text,
  county text,
  country text default 'United Kingdom',
  postcode text,
  preferred_contact_method text,
  experience_level text,
  testing_experience text,
  motivation text,
  relevant_experience_area text,
  devices jsonb default '[]'::jsonb,
  browsers jsonb default '[]'::jsonb,
  internet_connection jsonb default '[]'::jsonb,
  testing_capabilities jsonb default '[]'::jsonb,
  testing_interests jsonb default '[]'::jsonb,
  accessibility_tools text,
  availability jsonb default ''::jsonb,
  preferred_payment_method text,
  payment_confirmations jsonb default '[]'::jsonb,
  eligibility_confirmations jsonb default '[]'::jsonb,
  current_step integer default 1,
  completion_percentage integer default 0,
  terms_acceptance_id uuid references public.uat_terms_acceptances(id),
  application_data jsonb default ''::jsonb,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid references auth.users(id),
  staff_notes text,
  internal_status_notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_uat_applications_user
  on public.uat_tester_applications (user_id);

create index if not exists idx_uat_applications_status
  on public.uat_tester_applications (status);

create index if not exists idx_uat_applications_reference
  on public.uat_tester_applications (application_reference);

create index if not exists idx_uat_applications_submitted
  on public.uat_tester_applications (submitted_at)
  where status = 'submitted';

alter table public.uat_tester_applications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'applicants_select_own'
    and tablename = 'uat_tester_applications'
  ) then
    create policy "applicants_select_own"
      on public.uat_tester_applications
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'applicants_insert_own'
    and tablename = 'uat_tester_applications'
  ) then
    create policy "applicants_insert_own"
      on public.uat_tester_applications
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'applicants_update_own_draft'
    and tablename = 'uat_tester_applications'
  ) then
    create policy "applicants_update_own_draft"
      on public.uat_tester_applications
      for update
      to authenticated
      using (user_id = auth.uid() and status = 'draft');
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'staff_read_all_applications'
    and tablename = 'uat_tester_applications'
  ) then
    create policy "staff_read_all_applications"
      on public.uat_tester_applications
      for select
      to authenticated
      using (
        exists (
          select 1 from public.staff_profiles
          where id = auth.uid()
          and role in ('staff', 'admin', 'super_admin')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'staff_update_applications'
    and tablename = 'uat_tester_applications'
  ) then
    create policy "staff_update_applications"
      on public.uat_tester_applications
      for update
      to authenticated
      using (
        exists (
          select 1 from public.staff_profiles
          where id = auth.uid()
          and role in ('staff', 'admin', 'super_admin')
        )
      );
  end if;
end $$;