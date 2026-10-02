/**
 * Same-origin AI gateway.
 * The provider key is read from server environment only. The handler stays
 * disabled until that key and the Supabase project credentials are set.
 * Coach and receipt calls also require a verified session, a consent
 * acknowledgement, and an in-memory rate limit.
 */

export const COACH_MODEL = 'claude-haiku-4-5-20251001';
export const PROVIDER_URL = 'https://api.anthropic.com/v1/messages';
const CONSENT_HEADER = 'x-maokoto-ai-consent';
const COACH_PREFIX = 'You are Maokoto Budget Coach';
const SYSTEM_MAX = 32000;
const MESSAGE_MAX = 2000;
const MESSAGES_MAX = 16;
const RECEIPT_DATA_MAX = 1_500_000;
const RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const RECEIPT_PROMPT = 'Extract from this receipt: total amount (number, no currency symbols), merchant or item description (short), date in YYYY-MM-DD format. Reply ONLY with valid JSON: {"amount": 1234, "notes": "KFC Mlimani", "date": "2024-01-15"}. If this is not a receipt, reply {"error": "not a receipt"}.';

const SERVER_KEYS = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];

export function selectGatewayEnv(source = {}) {
  const out = {};
  for (const key of SERVER_KEYS) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) out[key] = value.trim();
  }
  return out;
}

export function gatewayEnabled(env) {
  const selected = selectGatewayEnv(env);
  return SERVER_KEYS.every((key) => Boolean(selected[key]));
}

export function createRateLimiter({ limit, windowMs, now, maxKeys = 5000 }) {
  const buckets = new Map();
  return function take(key) {
    const t = now();
    const recent = (buckets.get(key) || []).filter((ts) => t - ts < windowMs);
    if (recent.length >= limit) {
      buckets.delete(key);
      buckets.set(key, recent);
      return { ok: false, retryAfterMs: Math.max(0, windowMs - (t - recent[0])) };
    }
    recent.push(t);
    buckets.delete(key);
    buckets.set(key, recent);
    while (buckets.size > maxKeys) {
      const oldest = buckets.keys().next().value;
      buckets.delete(oldest);
    }
    return { ok: true };
  };
}

export function createAiGateway(deps = {}) {
  const env = selectGatewayEnv(deps.env ?? {});
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const now = deps.now ?? Date.now;
  const windowMs = deps.windowMs ?? 60 * 60 * 1000;
  const verifyAuth = deps.verifyAuth ?? ((token) => verifySupabaseUser(token, env, fetchImpl));
  const coachLimit = createRateLimiter({ limit: deps.coachLimit ?? 20, windowMs, now });
  const receiptLimit = createRateLimiter({ limit: deps.receiptLimit ?? 5, windowMs, now });
  const globalLimit = createRateLimiter({ limit: deps.globalLimit ?? 120, windowMs, now });

  return async function handle(request) {
    const method = String(request.method || 'GET').toUpperCase();
    const url = String(request.url || '').split('?')[0];

    if (url === '/api/ai/status') {
      if (method !== 'GET') return json(405, { error: 'method' });
      return json(200, { enabled: gatewayEnabled(env) });
    }
    if (url !== '/api/ai/coach' && url !== '/api/ai/receipt') {
      return json(404, { error: 'not_found' });
    }
    if (method !== 'POST') return json(405, { error: 'method' });
    if (!gatewayEnabled(env)) return json(503, { error: 'disabled' });

    const token = bearer(request.headers);
    if (!token) return json(401, { error: 'unauthorized' });
    const user = await verifyAuth(token);
    if (!user?.userId || !/^[A-Za-z0-9-]{1,128}$/.test(user.userId)) {
      return json(401, { error: 'unauthorized' });
    }
    if (header(request.headers, CONSENT_HEADER) !== 'granted') {
      return json(403, { error: 'consent_required' });
    }

    const parsed = url === '/api/ai/coach' ? parseCoach(request.body) : parseReceipt(request.body);
    if (!parsed.ok) return json(400, { error: 'invalid_request' });

    const globalHit = globalLimit('global');
    if (!globalHit.ok) return rateLimited(globalHit);
    const bucket = url === '/api/ai/coach' ? coachLimit : receiptLimit;
    const hit = bucket(user.userId);
    if (!hit.ok) return rateLimited(hit);

    try {
      if (url === '/api/ai/coach') return await completeCoach(parsed.value, env, fetchImpl);
      return await completeReceipt(parsed.value, env, fetchImpl);
    } catch {
      return json(502, { error: 'upstream' });
    }
  };
}

export function createConnectHandler(deps = {}) {
  const handle = createAiGateway(deps);
  return function connect(req, res) {
    const url = String(req.url || '').split('?')[0];
    const limit = url === '/api/ai/receipt' ? 2 * 1024 * 1024 : 96 * 1024;
    const send = (result) => {
      res.statusCode = result.status;
      for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
      res.end(result.body);
    };
    const fail = (status, error) => {
      res.statusCode = status;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ error }));
    };
    if (req.method === 'GET' || req.method === 'HEAD') {
      return Promise.resolve(handle({ method: req.method, url: req.url, headers: req.headers, body: '' })).then(send, () => fail(500, 'server'));
    }
    return readBody(req, limit).then(
      (body) => handle({ method: req.method, url: req.url, headers: req.headers, body }).then(send, () => fail(500, 'server')),
      (err) => fail(err.statusCode || 500, err.statusCode === 413 ? 'too_large' : 'server'),
    );
  };
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > limit) {
        rejected = true;
        const error = new Error('too large');
        error.statusCode = 413;
        req.destroy();
        reject(error);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!rejected) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (!rejected) reject(err);
    });
  });
}

async function verifySupabaseUser(token, env, fetchImpl) {
  if (!looksLikeJwt(token)) return null;
  let res;
  try {
    res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      redirect: 'error',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return null;
  }
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data || typeof data.id !== 'string') return null;
  return { userId: data.id };
}

async function completeCoach(value, env, fetchImpl) {
  const text = await callModel(env, fetchImpl, {
    model: COACH_MODEL,
    max_tokens: 700,
    system: value.system,
    messages: value.messages,
  });
  if (!text) return json(502, { error: 'upstream' });
  return json(200, { text });
}

async function completeReceipt(value, env, fetchImpl) {
  const text = await callModel(env, fetchImpl, {
    model: COACH_MODEL,
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: value.mediaType, data: value.data } },
        { type: 'text', text: RECEIPT_PROMPT },
      ],
    }],
  });
  if (!text) return json(502, { error: 'upstream' });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return json(422, { error: 'unreadable' });
  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return json(422, { error: 'unreadable' });
  }
  if (parsed?.error) return json(422, { error: 'not_receipt' });
  const amount = Number(parsed?.amount);
  const notes = typeof parsed?.notes === 'string' ? parsed.notes.slice(0, 200) : null;
  const date = typeof parsed?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
  return json(200, {
    amount: Number.isFinite(amount) ? amount : null,
    notes,
    date,
  });
}

async function callModel(env, fetchImpl, payload) {
  const res = await fetchImpl(PROVIDER_URL, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const block = blocks.find((item) => item?.type === 'text' && typeof item.text === 'string');
  if (!block?.text?.trim()) return null;
  if (block.text.includes(env.ANTHROPIC_API_KEY)) return null;
  return block.text;
}

function parseCoach(body) {
  const data = parseJson(body);
  if (!data || typeof data.system !== 'string' || !data.system.startsWith(COACH_PREFIX)) return { ok: false };
  if (data.system.length > SYSTEM_MAX || !Array.isArray(data.messages)) return { ok: false };
  if (data.messages.length < 1 || data.messages.length > MESSAGES_MAX) return { ok: false };
  const messages = [];
  for (const message of data.messages) {
    if (!message || (message.role !== 'user' && message.role !== 'assistant')) return { ok: false };
    if (typeof message.content !== 'string' || message.content.length < 1 || message.content.length > MESSAGE_MAX) {
      return { ok: false };
    }
    messages.push({ role: message.role, content: message.content });
  }
  while (messages.length && messages[0].role === 'assistant') messages.shift();
  if (!messages.length || messages[0].role !== 'user') return { ok: false };
  for (let i = 1; i < messages.length; i += 1) {
    if (messages[i].role === messages[i - 1].role) return { ok: false };
  }
  return { ok: true, value: { system: data.system, messages } };
}

function parseReceipt(body) {
  const data = parseJson(body);
  if (!data || !RECEIPT_TYPES.has(data.mediaType) || typeof data.data !== 'string') return { ok: false };
  const cleaned = data.data.replace(/\s/g, '');
  if (cleaned.length < 16 || cleaned.length > RECEIPT_DATA_MAX || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    return { ok: false };
  }
  return { ok: true, value: { mediaType: data.mediaType, data: cleaned } };
}

function parseJson(body) {
  if (typeof body !== 'string' || !body) return null;
  try {
    const data = JSON.parse(body);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

function bearer(headers) {
  const value = header(headers, 'authorization');
  const match = /^Bearer\s+(\S+)$/i.exec(value);
  return match ? match[1] : null;
}

function header(headers, name) {
  if (!headers) return '';
  const value = headers[name] ?? headers[name.toLowerCase()] ?? '';
  return Array.isArray(value) ? String(value[0] ?? '') : String(value);
}

function looksLikeJwt(token) {
  return typeof token === 'string' && token.length <= 8192 && token.split('.').length === 3;
}

function json(status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function rateLimited(hit) {
  const seconds = Math.max(1, Math.ceil(hit.retryAfterMs / 1000));
  return json(429, { error: 'rate_limited', retryAfterSeconds: seconds }, { 'retry-after': String(seconds) });
}
