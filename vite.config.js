import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  base: process.env.GITHUB_ACTIONS ? '/ultimate-tic-tac-toe/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
