import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'LipSyncEngine',
      formats: ['es', 'cjs'],
      fileName: (format) => `lipsync-engine.${format === 'es' ? 'js' : 'cjs'}`
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  },
  server: {
    headers: {
      // Required for AudioWorklet + SharedArrayBuffer
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
