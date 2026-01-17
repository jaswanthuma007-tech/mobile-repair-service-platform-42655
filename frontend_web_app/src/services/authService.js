import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

let memorySession = { isAdminAuthed: false, email: null };

/**
 * PUBLIC_INTERFACE
 * Returns current admin auth session (fallback uses in-memory state).
 */
export async function getAdminSession() {
  if (!isSupabaseConfigured()) return { data: memorySession, error: null };

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { data: null, error };
    const session = data?.session;
    return {
      data: { isAdminAuthed: Boolean(session), email: session?.user?.email ?? null },
      error: null
    };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Signs in an admin user. With fallback, accepts any non-empty credentials.
 */
export async function signInAdmin({ email, password }) {
  if (!isSupabaseConfigured()) {
    if (!email || !password) return { data: null, error: new Error('Email and password are required.') };
    memorySession = { isAdminAuthed: true, email };
    return { data: memorySession, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };
    return {
      data: { isAdminAuthed: Boolean(data?.session), email: data?.user?.email ?? email },
      error: null
    };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Signs out the current admin user.
 */
export async function signOutAdmin() {
  if (!isSupabaseConfigured()) {
    memorySession = { isAdminAuthed: false, email: null };
    return { data: memorySession, error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { data: null, error };
    return { data: { isAdminAuthed: false, email: null }, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}
