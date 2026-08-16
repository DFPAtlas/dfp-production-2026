-- DFP UAT Phase 2C-2 -- Feedback-to-session-event linking
-- Safe additive migration

create table if not exists uat_feedback_session_events (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references uat_feedback(id) on delete cascade,
  session_event_id uuid not null references uat_session_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(feedback_id, session_event_id)
);

create index if not exists idx_fse_feedback on uat_feedback_session_events(feedback_id);
create index if not exists idx_fse_session_event on uat_feedback_session_events(session_event_id);

alter table uat_feedback_session_events enable row level security;

create policy staff_all_fse on uat_feedback_session_events for all to authenticated
  using (exists (select 1 from admin_profiles where email = auth.jwt()->>'email' and role in ('admin','super_admin','staff')))
  with check (exists (select 1 from admin_profiles where email = auth.jwt()->>'email' and role in ('admin','super_admin','staff')));

create policy tester_select_fse on uat_feedback_session_events for select to authenticated
  using (exists (
    select 1 from uat_feedback f join uat_testers t on t.id = f.tester_id
    where f.id = feedback_id and t.user_id = auth.uid() and t.status = 'approved'
  ));

create policy tester_insert_fse on uat_feedback_session_events for insert to authenticated
  with check (exists (
    select 1 from uat_feedback f join uat_testers t on t.id = f.tester_id
    where f.id = feedback_id and t.user_id = auth.uid() and t.status = 'approved'
  ));