-- UAT Terms & Legal Agreement System
-- Creates versioned terms, acceptance tracking and PDF storage

create table if not exists public.uat_terms_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  effective_at timestamp with time zone not null default now(),
  content_json jsonb not null,
  content_hash text not null,
  is_active boolean not null default false,
  created_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.uat_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version_id uuid not null references public.uat_terms_versions(id),
  tester_email text not null,
  legal_name text not null,
  typed_signature text not null,
  section_acceptances jsonb not null default '[]'::jsonb,
  declaration_acceptances jsonb not null default '[]'::jsonb,
  accepted_at timestamp with time zone not null default now(),
  content_hash text not null,
  pdf_storage_path text,
  pdf_sha256 text,
  user_agent text,
  created_at timestamp with time zone not null default now(),
  unique(user_id, terms_version_id)
);

create index if not exists idx_uat_terms_acceptances_user
  on public.uat_terms_acceptances (user_id);

create index if not exists idx_uat_terms_acceptances_version
  on public.uat_terms_acceptances (terms_version_id);

create index if not exists idx_uat_terms_versions_active
  on public.uat_terms_versions (is_active)
  where is_active = true;

alter table public.uat_terms_versions enable row level security;
alter table public.uat_terms_acceptances enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'authenticated_read_active_version'
    and tablename = 'uat_terms_versions'
  ) then
    create policy "authenticated_read_active_version"
      on public.uat_terms_versions
      for select
      to authenticated
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'staff_manage_versions'
    and tablename = 'uat_terms_versions'
  ) then
    create policy "staff_manage_versions"
      on public.uat_terms_versions
      for all
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

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'users_read_own_acceptance'
    and tablename = 'uat_terms_acceptances'
  ) then
    create policy "users_read_own_acceptance"
      on public.uat_terms_acceptances
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'staff_read_all_acceptances'
    and tablename = 'uat_terms_acceptances'
  ) then
    create policy "staff_read_all_acceptances"
      on public.uat_terms_acceptances
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
end $$;

do $$
begin
  if not exists (
    select 1 from storage.buckets where name = 'uat-legal-agreements'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('uat-legal-agreements', 'uat-legal-agreements', false, 10485760, array['application/pdf']);
  end if;
end $$;