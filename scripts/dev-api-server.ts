import http from 'http';
import { URL } from 'url';

// Import the serverless handlers from the project's API file.
// This file is TypeScript; the dev helper expects to be run with `ts-node/esm`
// (we add an npm script that uses that loader). The handlers export `POST` and `GET`.
import * as api from '../api/index.ts';

const PORT = 8787;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/api') {
      // Collect body
      let body = '';
      for await (const chunk of req) body += chunk;

      const request = new Request(`http://localhost:${PORT}${url.pathname}`, {
        method: 'POST',
        headers: req.headers as any,
        body,
      });

      const response = await api.POST(request as any);
      const text = await response.text();

      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(text);
      return;
    }

    if (req.method === 'GET' && (url.pathname === '/api' || url.pathname === '/api/cron')) {
      const request = new Request(`http://localhost:${PORT}${url.pathname}`, { method: 'GET', headers: req.headers as any });
      const response = await api.GET(request as any);
      const text = await response.text();
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(text);
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (err: any) {
    console.error('Dev API server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Dev API server listening at http://localhost:${PORT}`);
  console.log('Proxy /api requests from the frontend to this server (vite proxy should be configured).');
});

export {};
