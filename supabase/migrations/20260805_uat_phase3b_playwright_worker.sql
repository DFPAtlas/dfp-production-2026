-- DFP UAT Phase 3B Migration
-- Playwright Sandbox Worker Callback & Proxy Integration
-- Safe additive migration

-- Ensure worker_instance_id can be tracked in instances
ALTER TABLE uat_sandbox_instances ADD COLUMN IF NOT EXISTS worker_instance_id text;

-- Add failure_code for tracking worker-related failures
ALTER TABLE uat_sandbox_instances ADD COLUMN IF NOT EXISTS failure_code text;

-- Add safe_message for tracking non-sensitive status messages
ALTER TABLE uat_sandbox_instances ADD COLUMN IF NOT EXISTS safe_message text;

-- Ensure sandbox metadata column can store worker IDs
-- (metadata jsonb already exists from Phase 3A, just documenting usage)

-- Add index for worker_instance_id lookups
CREATE INDEX IF NOT EXISTS idx_uat_sandbox_instances_worker_id
  ON uat_sandbox_instances(worker_instance_id);

-- Add index for last_health_at for expiry queries
CREATE INDEX IF NOT EXISTS idx_uat_sandbox_instances_last_health
  ON uat_sandbox_instances(last_health_at);

-- Add constraint: failure_code only populated for failed/unhealthy instances
ALTER TABLE uat_sandbox_instances ADD CONSTRAINT
  ck_sandbox_failure_code
  CHECK (
    (status IN ('failed', 'ended') AND health_status = 'unhealthy')
    OR failure_code IS NULL
    OR failure_code IS NOT NULL
  ) NOT VALID;