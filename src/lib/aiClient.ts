import { supabase } from '@/lib/supabase';

let statusPromise: Promise<boolean> | null = null;

/** Same-origin gateway only. The provider key is never read in the browser. */
export function cloudAiEnabled(): Promise<boolean> {
  if (!statusPromise) statusPromise = fetchStatus();
  return statusPromise;
}

export async function getAiAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) return null;
  return data.session.access_token;
}

export async function requestCoachReply(
  input: { system: string; messages: { role: 'user' | 'assistant'; content: string }[] },
  token: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      signal,
      cache: 'no-store',
      headers: consentHeaders(token),
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data.text !== 'string' || !data.text.trim()) return null;
    return data.text;
  } catch {
    return null;
  }
}

export async function requestReceiptScan(
  input: { mediaType: string; data: string },
  token: string,
): Promise<
  | { ok: true; amount: number | null; notes: string | null; date: string | null }
  | { ok: false; reason: 'not_receipt' | 'unavailable' }
> {
  try {
    const res = await fetch('/api/ai/receipt', {
      method: 'POST',
      cache: 'no-store',
      headers: consentHeaders(token),
      body: JSON.stringify(input),
    });
    if (res.status === 422) return { ok: false, reason: 'not_receipt' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return { ok: false, reason: 'unavailable' };
    return {
      ok: true,
      amount: typeof data.amount === 'number' && Number.isFinite(data.amount) ? data.amount : null,
      notes: typeof data.notes === 'string' ? data.notes : null,
      date: typeof data.date === 'string' ? data.date : null,
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

function consentHeaders(token: string): HeadersInit {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
    'x-maokoto-ai-consent': 'granted',
  };
}

async function fetchStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/ai/status', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return data?.enabled === true;
  } catch {
    return false;
  }
}
