Production deployment guide — quick path (Vercel) and alternative (Docker/Cloud Run)

Recommended quick route: Vercel (fast, serverless, free tier)

1) Connect your GitHub repository to Vercel
   - Go to https://vercel.com/new and import your repo.

2) Set environment variables in the Vercel project settings
   - Required (set these in the Environment → Environment Variables panel):
     - API_KEY — Gemini / Google GenAI API key
     - SUPABASE_URL — your Supabase URL (e.g. https://xyz.supabase.co)
     - SUPABASE_ANON_KEY — (or SUPABASE_SERVICE_ROLE_KEY) for DB access
   - For writes from serverless functions prefer `SUPABASE_SERVICE_ROLE_KEY` (keep it secret).

3) Build & Deploy
   - Vercel will run the build and deploy. The provided `vercel.json` routes `/api/*` to the serverless entry wrapper, which delegates to your existing `api/index.ts` logic.

4) Verify
   - After deployment, visit the Vercel URL and check a topic page in the UI — network calls to `/api` should succeed.
   - If you see server errors, check Vercel function logs for the stack trace.

Alternative: Docker + Cloud Run (container deploy)

1) Add environment variables to your hosting provider (Cloud Run/GCP secrets).
2) Build a Docker image that serves the static Vite build and runs a small Node server that delegates API calls to your serverless handlers.
3) Push image to a registry and deploy to Cloud Run.

Notes & safety
 - Keep `SUPABASE_SERVICE_ROLE_KEY` only in server-side secrets in Vercel (Environment Variables, not committed to repo).
 - Gemini/API_KEY must be stored securely as well.
 - If you want a local dev fallback (no API key) I can add a toggle to return sample posts so you can iterate on UI without secrets.
