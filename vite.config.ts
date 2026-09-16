import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  base: process.env.REL_BASE ? './' : process.env.GH_PAGES ? '/kennett-spirit-shop/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    assetsInlineLimit: process.env.INLINE_ASSETS ? Number.MAX_SAFE_INTEGER : undefined,
  },
});
