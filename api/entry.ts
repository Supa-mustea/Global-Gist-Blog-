/*
 Vercel-friendly entrypoint that adapts the existing serverless handlers
 exported from `api/index.ts` to the standard `(req, res)` signature that
 Vercel (and many Node hosts) expect for serverless functions.

 It delegates to the POST/GET functions in `api/index.ts` which already
 implement the application logic using the Web Fetch API `Request`/`Response`.
*/

// Dynamically import the API module at invocation time so import-time errors
// can be captured and returned to the caller. This prevents Vercel from
// returning a generic FUNCTION_INVOCATION_FAILED and lets us surface the
// actual initialization error for debugging.
export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    let api: any;
    try {
      // Import the compiled JS module produced by the Vercel build output.
      api = await import('./index.js');
    } catch (importErr: any) {
      console.error('Failed to import api/index at runtime:', importErr);
      res.status(500).json({ error: 'Server initialization failed', message: importErr?.message });
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;

      try {
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
      } catch (err: any) {
        console.error('API POST handler error:', err);
        res.status(500).json({ error: err?.message || 'Internal server error in POST handler' });
        return;
      }
    }

    if (req.method === 'GET') {
      try {
        const request = new Request(url.toString(), { method: 'GET', headers: req.headers as any });
        const response = await api.GET(request as any);
        const text = await response.text();
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.status(response.status).send(text);
        return;
      } catch (err: any) {
        console.error('API GET handler error:', err);
        res.status(500).json({ error: err?.message || 'Internal server error in GET handler' });
        return;
      }
    }

    res.status(405).send({ error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('API entry handler unexpected error:', err);
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
