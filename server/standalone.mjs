import http from 'node:http';
import { createConnectHandler, selectGatewayEnv } from './aiGateway.mjs';

const env = selectGatewayEnv(process.env);
const handler = createConnectHandler({ env });
const host = process.env.HOST || '127.0.0.1';
const port = listenPort(process.env.PORT);

const server = http.createServer((req, res) => {
  const url = String(req.url || '').split('?')[0];
  if (!url.startsWith('/api/ai')) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }
  Promise.resolve(handler(req, res)).catch(() => {
    if (res.writableEnded) return;
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'server' }));
  });
});

server.listen(port, host);

function listenPort(value) {
  const portNumber = Number(value);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) return 8787;
  return portNumber;
}
