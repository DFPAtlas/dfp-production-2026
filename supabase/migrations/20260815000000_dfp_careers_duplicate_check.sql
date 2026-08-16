-- DFP FIX 20 — secure careers duplicate check.
-- Replaces the inert anonymous SELECT on career_applications (blocked by RLS)
-- with a SECURITY DEFINER function that returns ONLY a boolean. Anonymous
-- callers cannot enumerate applicant names, emails, history or statuses.
create or replace function public.has_career_application(
  p_vacancy_id uuid,
  p_email text
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.career_applications
    where vacancy_id = p_vacancy_id
      and lower(candidate_email) = lower(trim(p_email))
      and application_status <> 'withdrawn'
      and withdrawn_at is null
  );
$$;

revoke all on function public.has_career_application(uuid, text) from public;
grant execute on function public.has_career_application(uuid, text) to anon, authenticated;