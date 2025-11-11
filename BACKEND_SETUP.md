# Backend Setup (Supabase + Serverless API)

This file summarizes the README steps and provides quick commands and checks to get your backend ready.

## 1) Create your Supabase project

1. Go to https://app.supabase.com/ and create a new project.
2. In Project Settings > API, copy the **Project URL** and the **anon public key**.
3. Add those values to your local `.env.local` (or `.env`) or to your hosting provider's environment variables.

Example `.env.local` (DO NOT COMMIT):

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
API_KEY=your-google-gemini-api-key

Note: The `API_KEY` should be stored only in your server environment (Vercel/Netlify) and not in client-exposed env variables.

### Service Role Key (recommended for server writes)

For server-side operations that create/update/delete rows (for example: seeding content, creating posts, or moderating comments), use a Supabase "service_role" key. This key bypasses Row Level Security and must never be exposed to client code.

Where to find it:
- In the Supabase dashboard, open your project -> Settings -> API -> "Service Key" (labelled `service_role`).

How to use it:
- Add the value to your hosting provider's environment variables as `SUPABASE_SERVICE_ROLE_KEY` (or to your local `.env.local` for testing).
- The server will prefer `SUPABASE_SERVICE_ROLE_KEY` for writes when present. If it is not provided, the server will fall back to using `SUPABASE_ANON_KEY` — but that may fail for write operations if RLS and policies prevent anonymous writes.

Security note:
- Never commit the service role key to git or paste it into public chat. Store it only in your hosting provider's secret store (Vercel/Netlify/other).

## 2) Create the database tables

There are two ways to apply the SQL in `supabase/init.sql`:

A) Using the Supabase Dashboard:
- Open your project in the Supabase dashboard.
- Go to **SQL Editor** > **New query**.
- Paste the contents of `supabase/init.sql` and click **RUN**.

B) Using psql (advanced):
- Get the Postgres connection string from Project Settings > Database > Connection Pooling (or Connection string).
- Run: `psql <CONNECTION_STRING> -f supabase/init.sql`

## 3) Local environment validation (quick check)

A helper script `scripts/validate-env.js` is included to verify required env variables are present.

Run locally:

```bash
node scripts/validate-env.js
```

It will check that the required values (`SUPABASE_URL` and `API_KEY`) are present and will report whether the recommended Supabase keys (`SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`) are available.

## 4) Seed the sample data (optional)

If you want the example Plutowealth article added to your database automatically, use the included seed script. This requires the `SUPABASE_SERVICE_ROLE_KEY`.

1. Copy `.env.local.example` to `.env.local` (or update your `.env`) and add the `SUPABASE_SERVICE_ROLE_KEY` value (get it from the Supabase Dashboard -> Settings -> API -> Service Key).

```bash
cp .env.local.example .env.local
# edit .env.local and add SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL
```

2. Run the seed script locally:

```bash
node scripts/seed.js
```

The script will insert the sample article into the `posts` table. If you prefer not to run the script, you can paste the sample article data into the SQL editor or add rows manually.

## 4) Install dependencies

If you haven't already:

```bash
npm install
```

The project already depends on `@supabase/supabase-js` and `@google/genai`.

## 5) Deploy (Vercel / Netlify)

- Push your repository to GitHub.
- In your hosting provider (Vercel or Netlify), create a new project that points to the repository.
- Add these environment variables in your project settings:
  - `API_KEY` (Google Gemini API key)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

For Vercel: after deploying, your cron endpoint will be available at `https://<your-project>.vercel.app/api/cron` (see README for setting up Cron jobs).

## 6) Optional: Make env available to client code

If you need the Supabase client running in the browser to talk to Supabase directly, add Vite-prefixed variables to your `.env.local`:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

Then access them in client code via `import.meta.env.VITE_SUPABASE_URL`.

## Troubleshooting

- If you accidentally committed `.env` with real keys, remove it from git history and rotate keys.
- If the serverless API throws `Missing required environment variables on the server.`, ensure you set `API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in your hosting environment.
