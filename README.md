# Global Gist Blog

An AI-powered blog that discusses the top gists from around the globe, including news, lifestyle, tourism, and amazing historical stories, all grounded with real-time web search.

## ✨ Features

*   **Persistent Database Backend:** All articles and comments are stored in a central Supabase PostgreSQL database, making content permanent and shared across all users.
*   **AI-Powered Content Agent:** Features a dedicated API endpoint that can be run on a schedule (via a cron job) to continuously generate new, high-quality articles for multiple topics and add them to the database, ensuring the blog is always growing.
*   **Secure Serverless API:** A robust backend proxy handles all interactions with the database and the Google Gemini API, ensuring API keys and database credentials are never exposed to the browser.
*   **Full Admin Dashboard:** A comprehensive admin panel to:
    *   View blog statistics.
    *   Moderate comments (approve, reject, or auto-approve).
    *   Create, edit, and delete articles directly in the database.
*   **Rich Content & User Engagement:** All previous features like YouTube embedding, comment sections, social sharing, and "Save for Later" functionality are now powered by the persistent backend.

---
## 🚀 Publishing Your Blog: Production-Ready with a Database

This guide walks you through deploying a **secure, fast, and professional** version of the blog using a real database.

### ⚠️ Security Warning: Protect Your Credentials!

The backend requires credentials for both the Gemini API and your Supabase database. These are secrets and must **never** be exposed in your frontend code. The standard industry practice is to store them as **Environment Variables** on your hosting provider.

---
## Deployment Instructions

This guide uses **Vite** for building the frontend and a hosting provider like **Vercel** or **Netlify** for easy deployment and serverless functions.

### Prerequisites

*   [Node.js and npm](https://nodejs.org/en/) installed.
*   A [GitHub](https://github.com/), GitLab, or Bitbucket account.
*   A free account on [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
*   A free account on [Supabase](https://supabase.com/).

### Step 1: Set Up Your Supabase Database

This will be the permanent home for all your blog's content.

1.  **Create a new Supabase project:**
    *   Go to your [Supabase Dashboard](https://app.supabase.com/) and create a new project.
    *   Choose a strong, secure password for your database and save it.

2.  **Get Your Project Credentials:**
    *   In your new project, navigate to **Project Settings** (the gear icon) > **API**.
    *   You will need two values from this page:
        *   The **Project URL**.
        *   The **Project API Key** under the `anon` `public` key section.

3.  **Create Your Database Tables:**
    *   Go to the **SQL Editor** in the Supabase dashboard.
    *   Click **"New query"**.
    *   Copy the entire SQL code block below and paste it into the editor.
    *   Click **"RUN"**. This will create the `posts` and `comments` tables with the correct structure.

    ```sql
    -- Create the Posts table to store blog articles
    CREATE TABLE posts (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_description TEXT,
        youtube_video_id TEXT,
        author_name TEXT NOT NULL,
        author_bio TEXT NOT NULL,
        author_avatar_url TEXT NOT NULL,
        sources JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Create the Comments table to store user comments
    CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Optional: Enable Row Level Security (good practice)
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

    -- Create policies to allow public read access
    CREATE POLICY "Allow public read access to posts" ON posts FOR SELECT USING (true);
    CREATE POLICY "Allow public read access to comments" ON comments FOR SELECT USING (true);

    -- Create policies to allow authenticated users to insert/update/delete (if you add user login later)
    -- For now, our secure serverless function will handle mutations.
    ```

### Step 2: Set Up a Local Vite Project

Follow the "Publishing Your Blog" guide in the old README to set up a local Vite project, but with one addition:

1.  **Install the Supabase client library:**
    ```bash
    npm install @supabase/supabase-js
    ```

### Step 3: Deploy to the Web & Configure

1.  **Push to GitHub:**
    *   Create a new repository on GitHub and push your local project.

2.  **Deploy with Vercel/Netlify:**
    *   Sign up for Vercel (or Netlify) and import your new Git repository. Vercel will automatically detect it's a Vite project.
    *   Before deploying, go to the **Project Settings** -> **Environment Variables**.
    *   Add the following three secrets:
        *   `API_KEY`: Your Google Gemini API key.
        *   `SUPABASE_URL`: The Project URL you copied from your Supabase settings.
        *   `SUPABASE_ANON_KEY`: The `anon` `public` key you copied from Supabase.

3.  **Deploy:** Click "Deploy". Vercel will build your project, set up the serverless backend, and give you a live URL.

### Step 4: Activate the Continuous Content Agent (Cron Job)

To make your blog generate articles automatically, you need to schedule your content agent to run periodically.

1.  **Find your Cron Job URL:**
    *   After your site is deployed, your content agent will be available at a URL like: `https://<your-project-name>.vercel.app/api/cron`

2.  **Set up the Schedule (Example for Vercel):**
    *   In your Vercel project dashboard, go to the **Settings** -> **Cron Jobs** tab.
    *   Create a new Cron Job.
    *   **Schedule:** Enter `0 12 * * *` to run it once a day at noon. (This is a standard cron expression).
    *   **URL:** Paste the URL from the previous step.
    *   Save the job.

Now, your AI agent will wake up every day, pick several random topics, and add new, fresh content to your blog automatically!