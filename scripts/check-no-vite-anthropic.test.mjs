import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { scanBundle, scanSource } from './check-no-vite-anthropic.mjs';

function tempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'maokoto-ai-check-'));
}

test('source scan flags a client-prefixed provider variable', () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, 'src'));
  const name = ['VITE', 'ANTHROPIC', 'API', 'KEY'].join('_');
  fs.writeFileSync(path.join(root, 'src', 'leak.ts'), `const key = import.meta.env.${name};\n`);
  const hits = scanSource(root);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /leak\.ts:1:/);
  assert.match(hits[0], new RegExp(name));
});

test('source scan flags the provider SDK inside client code', () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src', 'client.ts'), `import X from '${['@', 'anthropic-ai/sdk'].join('')}';\n`);
  const hits = scanSource(root);
  assert.equal(hits.some((hit) => hit.includes('provider SDK')), true);
});

test('source scan passes a tree that keeps the provider on the server', () => {
  const root = tempRepo();
  fs.mkdirSync(path.join(root, 'server'));
  fs.writeFileSync(path.join(root, 'server', 'gateway.mjs'), `const host = '${['api.', 'anthropic.com'].join('')}';\n`);
  fs.writeFileSync(path.join(root, 'package.json'), '{"dependencies":{}}\n');
  assert.deepEqual(scanSource(root), []);
});

test('bundle scan flags provider material in built files', () => {
  const root = tempRepo();
  fs.writeFileSync(path.join(root, 'app.js'), `fetch('${['api.', 'anthropic.com'].join('')}')\n`);
  const hits = scanBundle(root);
  assert.equal(hits.some((hit) => hit.includes('provider host')), true);
});

test('this repository has no client provider variable or SDK reference', () => {
  const hits = scanSource(path.resolve(import.meta.dirname, '..'));
  assert.deepEqual(hits, []);
});
