alter table public.uat_tester_applications
  add column if not exists industry_experience jsonb default '[]'::jsonb,
  add column if not exists testing_activities jsonb default '[]'::jsonb,
  add column if not exists tester_strengths jsonb default '[]'::jsonb,
  add column if not exists preferred_testing_level text,
  add column if not exists practical_bug_report jsonb default null,
  add column if not exists practical_bug_report_score integer,
  add column if not exists practical_bug_report_reviewed_by uuid references auth.users(id),
  add column if not exists practical_bug_report_reviewed_at timestamp with time zone,
  add column if not exists device_profiles jsonb default '[]'::jsonb,
  add column if not exists test_environments jsonb default '[]'::jsonb,
  add column if not exists communication_preferences jsonb default ''::jsonb,
  add column if not exists response_speed text,
  add column if not exists preferred_session_length text,
  add column if not exists notice_required text,
  add column if not exists user_perspectives jsonb default '[]'::jsonb,
  add column if not exists accessibility_capabilities jsonb default '[]'::jsonb,
  add column if not exists accessibility_training_requested boolean default false,
  add column if not exists project_conflict_status text,
  add column if not exists project_conflict_details text,
  add column if not exists matching_profile jsonb default null,
  add column if not exists generated_tags text[] default ''::text[],
  add column if not exists matching_profile_updated_at timestamp with time zone;

create table if not exists public.uat_tester_tags (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  source text not null default 'auto',
  created_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id),
  removed_at timestamp with time zone,
  removed_by uuid references auth.users(id)
);

create index if not exists idx_uat_tester_tags_tester on public.uat_tester_tags (tester_id);
create index if not exists idx_uat_tester_tags_tag on public.uat_tester_tags (tag);

create table if not exists public.uat_project_matching_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.uat_projects(id) on delete cascade,
  requirements_json jsonb not null default ''::jsonb,
  preferred_json jsonb not null default ''::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_uat_project_reqs_project on public.uat_project_matching_requirements (project_id);

create table if not exists public.uat_tester_match_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.uat_projects(id) on delete cascade,
  tester_id uuid not null references auth.users(id) on delete cascade,
  dimension_scores jsonb not null default ''::jsonb,
  suitability_label text not null,
  explanation_json text,
  missing_requirements jsonb default '[]'::jsonb,
  calculated_at timestamp with time zone not null default now(),
  unique(project_id, tester_id)
);

create index if not exists idx_uat_match_results_project on public.uat_tester_match_results (project_id);
create index if not exists idx_uat_match_results_tester on public.uat_tester_match_results (tester_id);

alter table public.uat_tester_tags enable row level security;
alter table public.uat_project_matching_requirements enable row level security;
alter table public.uat_tester_match_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'testers_read_own_tags' and tablename = 'uat_tester_tags') then
    create policy "testers_read_own_tags" on public.uat_tester_tags for select to authenticated using (tester_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'staff_read_all_tags' and tablename = 'uat_tester_tags') then
    create policy "staff_read_all_tags" on public.uat_tester_tags for select to authenticated using (
      exists (select 1 from public.staff_profiles where id = auth.uid() and role in ('staff', 'admin', 'super_admin'))
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'staff_manage_tags' and tablename = 'uat_tester_tags') then
    create policy "staff_manage_tags" on public.uat_tester_tags for all to authenticated using (
      exists (select 1 from public.staff_profiles where id = auth.uid() and role in ('staff', 'admin', 'super_admin'))
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'staff_manage_matching_reqs' and tablename = 'uat_project_matching_requirements') then
    create policy "staff_manage_matching_reqs" on public.uat_project_matching_requirements for all to authenticated using (
      exists (select 1 from public.staff_profiles where id = auth.uid() and role in ('staff', 'admin', 'super_admin'))
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'staff_read_match_results' and tablename = 'uat_tester_match_results') then
    create policy "staff_read_match_results" on public.uat_tester_match_results for select to authenticated using (
      exists (select 1 from public.staff_profiles where id = auth.uid() and role in ('staff', 'admin', 'super_admin'))
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'staff_manage_match_results' and tablename = 'uat_tester_match_results') then
    create policy "staff_manage_match_results" on public.uat_tester_match_results for all to authenticated using (
      exists (select 1 from public.staff_profiles where id = auth.uid() and role in ('staff', 'admin', 'super_admin'))
    );
  end if;
end $$;