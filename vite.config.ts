import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // During local development, proxy `/api` calls to a local dev API server
        // so the frontend can call the same '/api' route as in production.
        // Run the dev API with: npm run dev:api
        proxy: {
          '/api': {
            target: 'http://localhost:8787',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      // Provide safe string fallbacks for env variables so Vite doesn't receive
      // undefined values. Avoid exposing highly-sensitive keys here; prefer
      // setting service keys only in server environments.
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || ''),
        // Provide Vite-prefixed fallbacks for client usage
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
