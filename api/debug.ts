// Temporary debug endpoint to return detailed error messages from serverless handlers.
// WARNING: This endpoint exposes internal error messages and stacks. Remove before leaving
// this temporary debugging state in production.

import * as api from './index';

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url || '/', `https://${req.headers.host}`);

    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;

      try {
        const request = new Request(url.toString(), { method: 'POST', headers: req.headers as any, body });
        const response = await api.POST(request as any);
        const text = await response.text();
        res.status(response.status).setHeader('content-type', response.headers.get('content-type') || 'application/json').send(text);
        return;
      } catch (err: any) {
        console.error('Debug POST handler caught error:', err);
        res.status(500).json({ debug: true, message: err?.message, stack: err?.stack });
        return;
      }
    }

    if (req.method === 'GET') {
      try {
        const request = new Request(url.toString(), { method: 'GET', headers: req.headers as any });
        const response = await api.GET(request as any);
        const text = await response.text();
        res.status(response.status).setHeader('content-type', response.headers.get('content-type') || 'application/json').send(text);
        return;
      } catch (err: any) {
        console.error('Debug GET handler caught error:', err);
        res.status(500).json({ debug: true, message: err?.message, stack: err?.stack });
        return;
      }
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('Debug handler unexpected error:', err);
    res.status(500).json({ debug: true, message: err?.message, stack: err?.stack });
  }
}
