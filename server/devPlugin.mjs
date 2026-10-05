import fs from 'node:fs';
import path from 'node:path';
import { createConnectHandler, selectGatewayEnv } from './aiGateway.mjs';

/**
 * Mounts the AI gateway on the Vite dev and preview servers.
 * The module is imported by vite.config only, so it is not part of the client bundle.
 */
export function aiGatewayPlugin() {
  return {
    name: 'maokoto-ai-gateway',
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}

function attach(server) {
  const env = selectGatewayEnv({
    ...readDotenv(server.config.root, server.config.mode),
    ...process.env,
  });
  const handle = createConnectHandler({ env });
  server.middlewares.use((req, res, next) => {
    const url = String(req.url || '').split('?')[0];
    if (!url.startsWith('/api/ai')) return next();
    Promise.resolve(handle(req, res)).catch(() => {
      if (res.writableEnded) return;
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'server' }));
    });
  });
}

export function readDotenv(root, mode = 'development') {
  const merged = {};
  const files = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
  for (const file of files) {
    const full = path.join(root, file);
    let text = '';
    try {
      text = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      merged[key] = value;
    }
  }
  return merged;
}
