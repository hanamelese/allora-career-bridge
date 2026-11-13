import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The workspace packages (@onboarding/contracts, @onboarding/form-engine) are
// plain ESM source, symlinked into node_modules by npm workspaces. Vite needs
// to follow those symlinks rather than pre-bundle them, so that editing a
// shared schema is reflected in the dashboard immediately.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@onboarding/contracts', '@onboarding/form-engine'],
  },
  server: {
    // The dashboard calls /api/v1 on its own origin, so there is no CORS
    // request in development and no API address baked into the bundle.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
