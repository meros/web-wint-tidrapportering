/**
 * Lightweight production server — serves static files + proxies /api to Wint.
 * Zero external dependencies; uses Node 22 built-ins (native fetch, node:http, node:fs).
 *
 * Usage:
 *   node server.mjs              # default port 3000
 *   PORT=8080 node server.mjs    # custom port
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '3000', 10);
const API_TARGET = process.env.API_TARGET || 'https://api.wint.se';
const SPOOFED_ORIGIN = process.env.SPOOFED_ORIGIN || 'https://app.wint.se';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Proxy /api/* requests to the Wint API */
async function proxyApi(req, res) {
  const url = `${API_TARGET}${req.url}`;

  // Read the full request body if present
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  // Forward headers, override origin
  const headers = { ...req.headers };
  delete headers['host'];
  headers['origin'] = SPOOFED_ORIGIN;
  headers['referer'] = `${SPOOFED_ORIGIN}/`;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
      // Don't follow redirects — let the client handle them
      redirect: 'manual',
    });

    // Copy status + response headers
    const resHeaders = {};
    for (const [key, value] of upstream.headers.entries()) {
      // Replace upstream CORS headers with our own permissive ones
      if (key.startsWith('access-control-')) continue;
      // fetch() auto-decompresses, so drop encoding/length headers to avoid
      // the browser trying to decompress already-decompressed data
      if (key === 'content-encoding' || key === 'content-length' || key === 'transfer-encoding') continue;
      resHeaders[key] = value;
    }

    // Add permissive CORS headers
    resHeaders['access-control-allow-origin'] = '*';
    resHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    resHeaders['access-control-allow-headers'] = '*';
    resHeaders['access-control-expose-headers'] = '*';

    res.writeHead(upstream.status, resHeaders);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error(`Proxy error: ${req.method} ${req.url}`, err.message);
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Bad Gateway');
  }
}

/** Handle CORS preflight */
function handlePreflight(res) {
  res.writeHead(204, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'access-control-allow-headers': '*',
    'access-control-max-age': '86400',
  });
  res.end();
}

/** Serve static files from dist/ with SPA fallback */
async function serveStatic(req, res) {
  let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url);

  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const content = await readFile(filePath);
    const ext = extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';

    // Cache hashed assets aggressively, everything else short-lived
    const cacheControl = filePath.includes('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=60';

    res.writeHead(200, { 'content-type': mime, 'cache-control': cacheControl });
    res.end(content);
  } catch {
    // SPA fallback — serve index.html for any non-file route
    try {
      const index = await readFile(join(DIST, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      res.end(index);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not Found — have you run `pnpm build`?');
    }
  }
}

const server = createServer(async (req, res) => {
  // CORS preflight for API routes
  if (req.method === 'OPTIONS' && req.url.startsWith('/api')) {
    return handlePreflight(res);
  }

  // Proxy API calls
  if (req.url.startsWith('/api')) {
    return proxyApi(req, res);
  }

  // Everything else: static files
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`🕐 Wint Time Reporting`);
  console.log(`   Static: ${DIST}`);
  console.log(`   Proxy:  /api → ${API_TARGET}`);
  console.log(`   Listen: http://localhost:${PORT}`);
});
