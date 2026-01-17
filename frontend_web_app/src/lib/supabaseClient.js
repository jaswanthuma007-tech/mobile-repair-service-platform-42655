import { createClient } from '@supabase/supabase-js';

/**
 * Returns a configured Supabase client, or null if env vars are not provided.
 * Uses CRA env vars: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.
 */
function buildSupabaseClient() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: true
    }
  });
}

export const supabase = buildSupabaseClient();

/**
 * PUBLIC_INTERFACE
 * True when Supabase env vars are available and a client can be used.
 */
export function isSupabaseConfigured() {
  return Boolean(supabase);
}
