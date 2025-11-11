#!/usr/bin/env node
// Simple script to validate required environment variables for local development.

const required = [
  'SUPABASE_URL',
  'API_KEY'
];

const recommended = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingRequired = required.filter((k) => !process.env[k]);
const missingRecommended = recommended.filter((k) => !process.env[k]);

if (missingRequired.length === 0) {
  console.log('All required environment variables are present:');
  required.forEach((k) => console.log(`  - ${k}`));

  if (missingRecommended.length === 0) {
    console.log('\nRecommended Supabase keys are present:');
    recommended.forEach((k) => console.log(`  - ${k}`));
  } else {
    console.log('\nRecommended Supabase keys (missing but optional):');
    missingRecommended.forEach((k) => console.log(`  - ${k}`));
    console.log('\nNotes:');
    console.log('  - For secure server-side writes you should provide SUPABASE_SERVICE_ROLE_KEY in your server environment.');
    console.log('  - SUPABASE_ANON_KEY is useful for local client testing, but may not be sufficient for writes if Row Level Security (RLS) is enabled.');
  }

  console.log('\nIf you plan to run serverless functions locally, make sure you set these in a local `.env` or `.env.local` file.');
  process.exit(0);
} else {
  console.error('Missing required environment variables:');
  missingRequired.forEach((k) => console.error(`  - ${k}`));
  console.log('\nNext steps:');
  console.log('  1) Copy `.env.local.example` to `.env.local` or edit your `.env` and add the missing values.');
  console.log('  2) If you are deploying, add these variables in your hosting provider (Vercel/Netlify) under Project Settings -> Environment Variables.');
  console.log('  3) For client-side usage in Vite, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to `.env.local` and reference via import.meta.env.');
  process.exit(1);
}
