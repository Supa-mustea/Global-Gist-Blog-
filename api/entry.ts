/*
 Vercel-friendly entrypoint that adapts the existing serverless handlers
 exported from `api/index.ts` to the standard `(req, res)` signature that
 Vercel (and many Node hosts) expect for serverless functions.

 It delegates to the POST/GET functions in `api/index.ts` which already
 implement the application logic using the Web Fetch API `Request`/`Response`.
*/

import * as api from './index.js';

// Vercel (and many serverless hosts) call the function with (req, res).
// We'll adapt Node's req/res to the Web Request and forward the Response back.
export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;

      const request = new Request(url.toString(), {
        method: 'POST',
        headers: req.headers as any,
        body,
      });

      const response = await api.POST(request as any);
      const text = await response.text();
      // copy headers
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(response.status).send(text);
      return;
    }

    if (req.method === 'GET') {
      const request = new Request(url.toString(), { method: 'GET', headers: req.headers as any });
      const response = await api.GET(request as any);
      const text = await response.text();
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.status(response.status).send(text);
      return;
    }

    res.status(405).send({ error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('API entry handler error:', err);
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
