/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  esbuild: {
    // Turn off debug mode in production: drop console statements and debuggers
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // Disable sourcemaps in production to protect source code from exposure
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_APP_ENV: 'test',
    },
  },
}));
