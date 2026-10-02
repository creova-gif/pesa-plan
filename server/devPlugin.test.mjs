import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { selectGatewayEnv } from './aiGateway.mjs';
import { readDotenv } from './devPlugin.mjs';

test('dotenv loading keeps the server key and drops the client-prefixed name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'maokoto-dotenv-'));
  const legacyName = ['VITE', 'ANTHROPIC', 'API', 'KEY'].join('_');
  fs.writeFileSync(path.join(root, '.env'), [
    `${legacyName}=should-not-enable`,
    'ANTHROPIC_API_KEY=server-side-test-value',
    'SUPABASE_URL=https://example.supabase.co',
    'SUPABASE_ANON_KEY=anon-test',
  ].join('\n'));
  const selected = selectGatewayEnv(readDotenv(root, 'development'));
  assert.equal(selected.ANTHROPIC_API_KEY, 'server-side-test-value');
  assert.equal(Object.hasOwn(selected, legacyName), false);
  assert.equal(selected.SUPABASE_URL, 'https://example.supabase.co');
});
