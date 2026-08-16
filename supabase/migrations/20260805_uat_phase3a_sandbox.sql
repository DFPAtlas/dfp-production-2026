-- DFP UAT Phase 3A: Isolated Sandbox Lifecycle and Test Data

-- Sandbox Settings per project/environment
CREATE TABLE IF NOT EXISTS uat_sandbox_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES uat_projects(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES uat_environments(id) ON DELETE SET NULL,
  sandbox_enabled boolean NOT NULL DEFAULT false,
  sandbox_mode text NOT NULL DEFAULT 'shared_staging',
  base_environment_url text,
  allowed_origins text[] NOT NULL DEFAULT ARRAY[]::text[],
  allowed_external_domains text[] NOT NULL DEFAULT ARRAY[]::text[],
  blocked_domains text[] NOT NULL DEFAULT ARRAY[]::text[],
  temporary_account_enabled boolean NOT NULL DEFAULT true,
  seed_data_enabled boolean NOT NULL DEFAULT true,
  reset_enabled boolean NOT NULL DEFAULT true,
  rebuild_enabled boolean NOT NULL DEFAULT false,
  email_interception_enabled boolean NOT NULL DEFAULT true,
  sms_interception_enabled boolean NOT NULL DEFAULT true,
  payment_test_mode_required boolean NOT NULL DEFAULT true,
  external_webhooks_blocked boolean NOT NULL DEFAULT true,
  downloads_allowed boolean NOT NULL DEFAULT true,
  uploads_allowed boolean NOT NULL DEFAULT true,
  session_duration_minutes integer NOT NULL DEFAULT 120,
  maximum_extension_minutes integer NOT NULL DEFAULT 60,
  cleanup_after_session boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES admin_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uat_sandbox_settings_mode_check CHECK (
    sandbox_mode IN ('shared_staging','isolated_dataset','isolated_browser','disposable_environment')
  )
);

-- Sandbox Instance per assignment+tester
CREATE TABLE IF NOT EXISTS uat_sandbox_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES uat_projects(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES uat_environments(id) ON DELETE SET NULL,
  job_id uuid REFERENCES uat_jobs(id) ON DELETE SET NULL,
  assignment_id uuid NOT NULL REFERENCES uat_assignments(id) ON DELETE CASCADE,
  session_id uuid REFERENCES uat_sessions(id) ON DELETE SET NULL,
  tester_id uuid NOT NULL REFERENCES uat_testers(id) ON DELETE CASCADE,
  sandbox_mode text NOT NULL DEFAULT 'shared_staging',
  status text NOT NULL DEFAULT 'requested',
  sandbox_url text,
  launch_reference text,
  started_at timestamptz,
  ready_at timestamptz,
  paused_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '120 minutes'),
  ended_at timestamptz,
  last_health_at timestamptz,
  health_status text DEFAULT 'unknown',
  reset_count integer NOT NULL DEFAULT 0,
  rebuild_count integer NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uat_sandbox_instances_status_check CHECK (
    status IN ('requested','provisioning','ready','active','paused','resetting','rebuilding','ending','ended','expired','failed')
  ),
  CONSTRAINT uat_sandbox_instances_health_check CHECK (
    health_status IN ('unknown','healthy','degraded','unhealthy')
  ),
  CONSTRAINT uat_sandbox_instances_mode_check CHECK (
    sandbox_mode IN ('shared_staging','isolated_dataset','isolated_browser','disposable_environment')
  )
);

-- Temporary sandbox accounts
CREATE TABLE IF NOT EXISTS uat_sandbox_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_instance_id uuid NOT NULL REFERENCES uat_sandbox_instances(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES uat_assignments(id) ON DELETE CASCADE,
  tester_id uuid NOT NULL REFERENCES uat_testers(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'tester',
  display_name text NOT NULL,
  username text,
  email text,
  credential_reference text,
  external_account_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '120 minutes'),
  disabled_at timestamptz,
  metadata jsonb,
  CONSTRAINT uat_sandbox_accounts_type_check CHECK (
    account_type IN ('tester','customer','admin_test','supplier_test','guard_test','other_test')
  ),
  CONSTRAINT uat_sandbox_accounts_status_check CHECK (
    status IN ('pending','active','disabled','expired','failed')
  )
);

-- Dataset templates for seed data
CREATE TABLE IF NOT EXISTS uat_sandbox_dataset_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES uat_projects(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES uat_environments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  dataset_definition jsonb,
  created_by uuid REFERENCES admin_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT uat_sandbox_dataset_templates_status_check CHECK (status IN ('draft','active','archived'))
);

-- Track seeded records per sandbox
CREATE TABLE IF NOT EXISTS uat_sandbox_seeded_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_instance_id uuid NOT NULL REFERENCES uat_sandbox_instances(id) ON DELETE CASCADE,
  dataset_template_id uuid REFERENCES uat_sandbox_dataset_templates(id) ON DELETE SET NULL,
  record_type text NOT NULL,
  source_table text,
  external_record_id text,
  display_reference text,
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  metadata jsonb,
  CONSTRAINT uat_sandbox_seeded_records_status_check CHECK (status IN ('created','updated','removed','failed'))
);

-- Sandbox action audit
CREATE TABLE IF NOT EXISTS uat_sandbox_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_instance_id uuid NOT NULL REFERENCES uat_sandbox_instances(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES uat_assignments(id) ON DELETE CASCADE,
  tester_id uuid NOT NULL REFERENCES uat_testers(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  failure_code text,
  safe_message text,
  metadata jsonb,
  CONSTRAINT uat_sandbox_actions_type_check CHECK (
    action_type IN ('provision','launch','pause','resume','reset_data','rebuild','extend','end','expire','health_check')
  ),
  CONSTRAINT uat_sandbox_actions_status_check CHECK (
    status IN ('requested','processing','completed','failed','cancelled')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sandbox_settings_project ON uat_sandbox_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_settings_env ON uat_sandbox_settings(environment_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_settings_enabled ON uat_sandbox_settings(sandbox_enabled);

CREATE INDEX IF NOT EXISTS idx_sandbox_instances_assignment ON uat_sandbox_instances(assignment_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_instances_tester ON uat_sandbox_instances(tester_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_instances_session ON uat_sandbox_instances(session_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_instances_project ON uat_sandbox_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_instances_status ON uat_sandbox_instances(status);
CREATE INDEX IF NOT EXISTS idx_sandbox_instances_mode ON uat_sandbox_instances(sandbox_mode);
CREATE INDEX IF NOT EXISTS idx_sandbox_instances_expires ON uat_sandbox_instances(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sandbox_instances_one_active
  ON uat_sandbox_instances(assignment_id, tester_id)
  WHERE status NOT IN ('ended','expired','failed');

CREATE INDEX IF NOT EXISTS idx_sandbox_accounts_instance ON uat_sandbox_accounts(sandbox_instance_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_accounts_tester ON uat_sandbox_accounts(tester_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_accounts_status ON uat_sandbox_accounts(status);

CREATE INDEX IF NOT EXISTS idx_sandbox_datasets_project ON uat_sandbox_dataset_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_datasets_status ON uat_sandbox_dataset_templates(status);

CREATE INDEX IF NOT EXISTS idx_sandbox_seeded_instance ON uat_sandbox_seeded_records(sandbox_instance_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_seeded_type ON uat_sandbox_seeded_records(record_type);

CREATE INDEX IF NOT EXISTS idx_sandbox_actions_instance ON uat_sandbox_actions(sandbox_instance_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_actions_type ON uat_sandbox_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_sandbox_actions_status ON uat_sandbox_actions(status);

-- RLS
ALTER TABLE uat_sandbox_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_sandbox_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_sandbox_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_sandbox_dataset_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_sandbox_seeded_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_sandbox_actions ENABLE ROW LEVEL SECURITY;

-- RPC Functions: request_uat_sandbox, get_uat_sandbox_access, pause_uat_sandbox,
-- resume_uat_sandbox, reset_uat_sandbox_data, extend_uat_sandbox, end_uat_sandbox
-- See the executed SQL for the function bodies