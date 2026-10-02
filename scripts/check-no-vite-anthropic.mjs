import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'web-build', '.expo', 'coverage']);
const TEXT_EXT = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.md',
  '.svg', '.yml', '.yaml', '.toml', '.txt', '.example',
]);
const CLIENT_DIRS = ['src', 'components', 'app', 'lib', 'mobile', 'utils', 'public'];
const clientEnvPattern = new RegExp(['VITE_', '[A-Z0-9_]*', 'ANTHROPIC', '[A-Z0-9_]*'].join(''), 'i');
const SDK_NEEDLE = ['@', 'anthropic-ai/sdk'].join('');
const BROWSER_NEEDLE = ['dangerouslyAllow', 'Browser'].join('');
const PROVIDER_HOST = ['api.', 'anthropic.com'].join('');
const KEY_PREFIX = ['sk-', 'ant-'].join('');
const SERVER_ENV_NAME = ['ANTHROPIC', '_API_KEY'].join('');

export function scanSource(root) {
  const hits = [];
  walk(root, (file) => {
    const rel = path.relative(root, file);
    const text = readText(file);
    if (text == null) return;
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      const match = line.match(clientEnvPattern);
      if (match) hits.push(`${rel}:${index + 1}: ${match[0]}`);
    });
    if (isClientPath(rel) && (text.includes(SDK_NEEDLE) || text.includes(BROWSER_NEEDLE) || text.includes(PROVIDER_HOST))) {
      hits.push(`${rel}: provider SDK or host referenced from client`);
    }
    if (path.basename(file) === 'package.json' && text.includes(SDK_NEEDLE)) {
      hits.push(`${rel}: provider SDK dependency`);
    }
  });
  return hits;
}

export function scanBundle(root) {
  const hits = [];
  if (!fs.existsSync(root)) return [`${root}: client bundle directory is missing`];
  walk(root, (file) => {
    const rel = path.relative(root, file);
    const text = readText(file);
    if (text == null) return;
    if (clientEnvPattern.test(text)) hits.push(`${rel}: client env provider variable in bundle`);
    if (text.includes(SDK_NEEDLE)) hits.push(`${rel}: provider SDK in bundle`);
    if (text.includes(BROWSER_NEEDLE)) hits.push(`${rel}: browser provider flag in bundle`);
    if (text.includes(PROVIDER_HOST)) hits.push(`${rel}: provider host in bundle`);
    if (text.includes(SERVER_ENV_NAME)) hits.push(`${rel}: server provider env name in bundle`);
    if (text.includes(KEY_PREFIX)) hits.push(`${rel}: provider key prefix in bundle`);
  }, { bundled: true });
  return hits;
}

function isClientPath(rel) {
  const parts = rel.split(path.sep);
  if (CLIENT_DIRS.includes(parts[0])) return true;
  return parts.length === 1 && /\.(html|js|ts|tsx|mjs)$/.test(parts[0]);
}

function walk(dir, onFile, options = {}) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!options.bundled && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, onFile, options);
      continue;
    }
    if (!entry.isFile() || skipFile(entry.name)) continue;
    onFile(full);
  }
}

function skipFile(name) {
  if (name === 'package-lock.json') return true;
  if (name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) return true;
  return false;
}

function readText(file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXT.has(ext) && ext !== '.map') return null;
  const info = fs.statSync(file);
  if (info.size > 2_000_000) return null;
  return fs.readFileSync(file, 'utf8');
}

function main() {
  const bundle = process.argv[2] === '--bundle';
  const target = path.resolve(process.argv[3] || (bundle ? 'dist' : process.cwd()));
  const hits = bundle ? scanBundle(target) : scanSource(target);
  if (hits.length) {
    for (const hit of hits) console.error(hit);
    process.exit(1);
  }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) main();
