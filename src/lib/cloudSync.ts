/**
 * Cloud sync service — localStorage-first, Supabase as background backup.
 *
 * Behaviour:
 *   - Every state change saves to localStorage immediately (unchanged).
 *   - If Supabase is configured, the state is also pushed to the cloud,
 *     debounced by 3 s to avoid hammering on rapid updates.
 *   - On first app load, if cloud data is newer than local data,
 *     the cloud version wins and is written back to localStorage.
 *
 * The app works identically with Supabase disabled — no API keys needed
 * for offline-only operation.
 */

import { supabase, isSupabaseEnabled, getOrCreateUserId } from './supabase';

const LOCAL_KEY = 'pesaplan_v1';
const SYNC_META_KEY = 'pesaplan_sync_meta';

interface SyncMeta {
  lastSyncedAt: string; // ISO timestamp of last successful push
  userId: string;
}

function getSyncMeta(): SyncMeta | null {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSyncMeta(meta: SyncMeta): void {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {}
}

// ── Push ─────────────────────────────────────────────────────────────────────

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Schedule a debounced cloud push. Called after every state save. */
export function schedulePush(stateJson: string): void {
  if (!isSupabaseEnabled) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => push(stateJson), 3000);
}

async function push(stateJson: string): Promise<void> {
  try {
    const userId = await getOrCreateUserId();
    const { error } = await supabase!.from('user_data').upsert(
      { user_id: userId, state: stateJson, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (!error) {
      setSyncMeta({ lastSyncedAt: new Date().toISOString(), userId });
    }
  } catch {
    // Network errors are silent — local data is still safe
  }
}

// ── Pull (on boot) ────────────────────────────────────────────────────────────

/**
 * On app boot, fetch cloud data and return it if it's newer than local.
 * Returns null if Supabase is disabled, unreachable, or local is up to date.
 */
export async function pullIfNewer(): Promise<string | null> {
  if (!isSupabaseEnabled) return null;

  try {
    const userId = await getOrCreateUserId();
    const { data, error } = await supabase!
      .from('user_data')
      .select('state, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const meta = getSyncMeta();
    const cloudTs = new Date(data.updated_at).getTime();
    const lastSync = meta?.lastSyncedAt ? new Date(meta.lastSyncedAt).getTime() : 0;

    // Local data was synced more recently than cloud — nothing to pull
    if (lastSync >= cloudTs) return null;

    // Cloud is newer — write it back to localStorage and return it
    const stateJson = typeof data.state === 'string'
      ? data.state
      : JSON.stringify(data.state);

    try {
      localStorage.setItem(LOCAL_KEY, stateJson);
    } catch {}

    setSyncMeta({ lastSyncedAt: data.updated_at, userId });
    return stateJson;
  } catch {
    return null;
  }
}

/** Clear all cloud data for this user (called from clearAllData). */
export async function deleteCloudData(): Promise<void> {
  if (!isSupabaseEnabled) return;
  try {
    const meta = getSyncMeta();
    if (!meta?.userId) return;
    await supabase!.from('user_data').delete().eq('user_id', meta.userId);
    localStorage.removeItem(SYNC_META_KEY);
  } catch {}
}
