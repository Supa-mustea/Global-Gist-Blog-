-- Create the Posts table to store blog articles
CREATE TABLE IF NOT EXISTS posts (
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
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Optional: Enable Row Level Security (good practice)
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read access to posts" ON posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access to comments" ON comments FOR SELECT USING (true);

-- Note: Further policies for authenticated mutations can be added later. The secure serverless API
-- will be used to perform inserts/updates/deletes so we keep direct DB writes locked down by default.
