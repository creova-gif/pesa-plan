/**
 * Supabase client — only active when VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set. Falls back to no-op when absent,
 * so the app runs in full offline-only mode without any config.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseEnabled = !!supabase;

/**
 * Returns the persistent anonymous user ID.
 * Creates an anonymous Supabase session on first call (one per device).
 * Falls back to a locally-generated UUID when Supabase is disabled.
 */
export async function getOrCreateUserId(): Promise<string> {
  const LOCAL_KEY = 'pesaplan_anon_id';

  if (!supabase) {
    let id = localStorage.getItem(LOCAL_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LOCAL_KEY, id);
    }
    return id;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    // Auth failed — fall back to local UUID
    let id = localStorage.getItem(LOCAL_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LOCAL_KEY, id);
    }
    return id;
  }

  return data.user.id;
}
