import http from 'node:http';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { URL } from 'node:url';

import { handleApiRequest } from './api.js';

const PORT = Number.parseInt(process.env.PORT || '3100', 10);
const REPO_ROOT = process.cwd();
const ROOT_DIR = process.env.REDCUBE_ROOT_DIR || process.cwd();
const PUBLIC_DIR = path.resolve('apps/redcube-web/public');

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf-8');
  return text ? JSON.parse(text) : {};
}

function serveFile(res, file, contentType) {
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(readFileSync(file));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/') {
      serveFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/app.js') {
      serveFile(res, path.join(PUBLIC_DIR, 'app.js'), 'text/javascript; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/settings') {
      serveFile(res, path.join(PUBLIC_DIR, 'settings.html'), 'text/html; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/settings.js') {
      serveFile(res, path.join(PUBLIC_DIR, 'settings.js'), 'text/javascript; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const query = Object.fromEntries(url.searchParams.entries());
      const result = await handleApiRequest({
        method: req.method || 'GET',
        pathname: url.pathname,
        query,
        body,
        defaultRootDir: ROOT_DIR,
        defaultRepoRoot: REPO_ROOT,
      });
      json(res, result.status, result.payload);
      return;
    }

    json(res, 404, { ok: false, error: `Unknown route: ${url.pathname}` });
  } catch (error) {
    json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, () => {
  process.stdout.write(`RedCube Web UI running on http://127.0.0.1:${PORT}\n`);
});
