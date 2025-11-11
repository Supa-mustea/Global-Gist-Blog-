import { createClient } from '@supabase/supabase-js';

// Lightweight health check for Supabase connectivity and basic API status.
// This endpoint intentionally avoids calling Gemini or other expensive services.

export default async function handler(req: any, res: any) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL) {
      return res.status(500).json({ ok: false, error: 'SUPABASE_URL not set' });
    }

    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    if (!key) {
      return res.status(500).json({ ok: false, error: 'No Supabase key set (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)' });
    }

    const supabase = createClient(SUPABASE_URL, key);

    // Quick check: count rows in posts table (limit 1 to be lightweight)
    const { data, error } = await supabase.from('posts').select('id', { count: 'exact', head: false }).limit(1);
    if (error) {
      return res.status(502).json({ ok: false, error: 'Supabase query failed', details: error.message });
    }

    // Optionally, check that API_KEY exists (Gemini) but do NOT call Gemini
    const apiKeyPresent = !!process.env.API_KEY || !!process.env.GEMINI_API_KEY;

    return res.status(200).json({ ok: true, supabase: { url: SUPABASE_URL, hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY, sampleRows: (data || []).length }, apiKeyPresent });
  } catch (err: any) {
    console.error('Ping handler error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Unexpected error' });
  }
}
