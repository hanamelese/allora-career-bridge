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
});
