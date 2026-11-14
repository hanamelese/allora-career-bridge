import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * One self-contained classic script, `dist/onboarding-widget.js`, that a
 * partner's page loads with <script src=… async>. React, the form engine
 * and the form's styles are all inside it; the API serves it at
 * /widget/v1/onboarding-widget.js.
 */
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: 'src/main.jsx',
      name: 'OnboardingWidget',
      formats: ['iife'],
      fileName: () => 'onboarding-widget.js',
    },
  },
});
