#!/usr/bin/env node
// Seed script to insert the example Plutowealth article into the `posts` table.
// This script uses the SUPABASE_SERVICE_ROLE_KEY from the environment. DO NOT
// commit your service role key to git. Run locally after adding the key to
// `.env.local` or exporting it in your shell.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Add them to .env.local or export them in your shell before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const plutowealthArticleData = {
  id: 'plutowealth-default-article-2025',
  topic: 'Breakthrough Tech Innovations',
  title: 'Plutowealth: How Three Young Innovators Are Building Africa’s Next Generation Fintech Platform',
  summary: 'In 2025, three Nigerian tech entrepreneurs came together with a shared vision: to make digital wealth management and financial literacy accessible to everyone. That vision gave birth to Plutowealth, a rising fintech company.',
  content: `\n### **Introduction**\nIn 2025, three Nigerian tech entrepreneurs — **Joseph Soronadi**, **Mustapha Lawal**, and **Abdulrahman Lawal** — came together with a shared vision: to make digital wealth management and financial literacy accessible to everyone. That vision gave birth to **Plutowealth**, a rising fintech company that’s already gaining attention in Abuja’s growing tech ecosystem.\n\n### **The Beginning**\nPlutowealth was founded on the belief that technology can bridge the gap between financial education and financial empowerment. The company’s founders — all tech enthusiasts — began developing digital tools to help users understand savings, investments, and personal finance in simple, engaging ways. According to **Joseph Soronadi**, a software engineer and founder of [Techminds Academy](https://techmindsacademy.org), “Our mission is to simplify financial literacy through innovation. We want to make wealth management something everyone can learn, not just professionals.”\n`,
  image_url: 'https://storage.googleapis.com/aai-web-samples/user-assets/tech-bootcamp-attendee.png',
  image_description: "Software innovation exhibition, Techminds Academy, May 2025.",
  youtube_video_id: null,
  author_name: 'Young Africans Scholars',
  author_bio: 'A collective of writers and researchers dedicated to highlighting innovation and entrepreneurship across the African continent.',
  author_avatar_url: 'https://picsum.photos/seed/young-african-scholars/100/100',
  sources: [
    { web: { title: 'Techminds Academy', uri: 'https://techmindsacademy.org' } },
    { web: { title: 'Supabros Inc.', uri: 'https://supabrosinc.vercel.app' } },
    { web: { title: 'Plutowealth GitHub Organization', uri: 'https://github.com/Plutowealth-org' } },
  ],
  created_at: new Date().toISOString(),
};

async function seed() {
  try {
    const { data, error } = await supabase.from('posts').insert([plutowealthArticleData]).select().single();
    if (error) {
      console.error('Failed to insert seed article:', error.message || error);
      process.exit(1);
    }
    console.log('Seed article inserted:', data.id || data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error while seeding:', err);
    process.exit(1);
  }
}

seed();
