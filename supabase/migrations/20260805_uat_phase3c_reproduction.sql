-- DFP UAT Phase 3C: Automated Bug Reproduction & Playwright Trace Evidence

-- Reproduction runs
CREATE TABLE IF NOT EXISTS uat_reproduction_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL,
  project_id uuid NOT NULL,
  environment_id uuid,
  assignment_id uuid NOT NULL,
  session_id uuid,
  sandbox_instance_id uuid,
  test_case_id uuid,
  assignment_test_case_id uuid,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  attempt_number integer NOT NULL DEFAULT 1,
  execution_mode text NOT NULL DEFAULT 'fresh_sandbox',
  browser_name text DEFAULT 'chromium',
  viewport_width integer DEFAULT 1280,
  viewport_height integer DEFAULT 720,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  reproduced boolean,
  confidence text,
  failure_code text,
  safe_summary text,
  worker_instance_id text,
  trace_evidence_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reproduction steps
CREATE TABLE IF NOT EXISTS uat_reproduction_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reproduction_run_id uuid NOT NULL,
  step_number integer NOT NULL,
  action_type text NOT NULL,
  target_description text,
  safe_selector text,
  input_reference text,
  expected_outcome text,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  safe_result text,
  screenshot_evidence_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reproduction event summaries
CREATE TABLE IF NOT EXISTS uat_reproduction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reproduction_run_id uuid NOT NULL,
  event_type text NOT NULL,
  severity text,
  safe_message text,
  request_method text,
  request_path text,
  response_status integer,
  duration_ms integer,
  step_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repro_runs_feedback ON uat_reproduction_runs(feedback_id);
CREATE INDEX IF NOT EXISTS idx_repro_runs_project ON uat_reproduction_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_repro_runs_assignment ON uat_reproduction_runs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_repro_runs_status ON uat_reproduction_runs(status);
CREATE INDEX IF NOT EXISTS idx_repro_runs_created ON uat_reproduction_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_repro_runs_worker ON uat_reproduction_runs(worker_instance_id);
CREATE INDEX IF NOT EXISTS idx_repro_steps_run ON uat_reproduction_steps(reproduction_run_id);
CREATE INDEX IF NOT EXISTS idx_repro_events_run ON uat_reproduction_events(reproduction_run_id);

-- RLS
ALTER TABLE uat_reproduction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_reproduction_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_reproduction_events ENABLE ROW LEVEL SECURITY;

-- Staff full access
DO $$ BEGIN
  CREATE POLICY "Staff full access on reproduction runs" ON uat_reproduction_runs FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Staff full access on reproduction steps" ON uat_reproduction_steps FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Staff full access on reproduction events" ON uat_reproduction_events FOR ALL USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tester read access (own feedback only)
DO $$ BEGIN
  CREATE POLICY "Testers read own reproduction runs" ON uat_reproduction_runs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM uat_feedback f
      JOIN uat_testers t ON t.id = f.tester_id
      WHERE f.id = feedback_id AND t.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Testers read own reproduction steps" ON uat_reproduction_steps FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM uat_reproduction_runs r
      JOIN uat_feedback f ON f.id = r.feedback_id
      JOIN uat_testers t ON t.id = f.tester_id
      WHERE r.id = reproduction_run_id AND t.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;