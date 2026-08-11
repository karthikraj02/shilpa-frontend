import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: path.resolve(__dirname, 'entry.jsx'), formats: ['es'], fileName: 'bundle' },
    outDir: path.resolve(__dirname, 'out'),
    emptyOutDir: true,
    minify: false,
    rollupOptions: { external: [] },
  },
  define: { 'process.env.NODE_ENV': '"development"' },
});
