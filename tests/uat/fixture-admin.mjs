import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './helpers.mjs';

export async function deleteFixtureRows(table, column, value) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !value) return;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await admin.from(table).delete().eq(column, value);
  if (error) throw new Error(`Could not clean UAT fixture from ${table}: ${error.message}`);
}
