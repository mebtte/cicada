import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolveVersion } from '../../scripts/build_version.mjs';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.join(CURRENT_DIR, 'src/static');

export default defineConfig(({ command }) => {
  const withSW = command === 'build' || process.env.WITH_SW === 'true';
  const version = resolveVersion({ command });

  return {
    publicDir: STATIC_DIR,
    server: {
      port: 8001,
    },
    resolve: {
      alias: {
        '@': path.resolve(CURRENT_DIR, 'src'),
      },
      symlinks: false,
    },
    define: {
      global: 'globalThis',
      __DEFINE__: JSON.stringify({
        VERSION: version,
        BUILD_TIME: new Date(),
      }),
      'process.env.WITH_SW': JSON.stringify(withSW),
    },
    plugins: [
      react(),
      withSW &&
        VitePWA({
          strategies: 'injectManifest',
          srcDir: 'src',
          filename: 'service_worker.ts',
          manifest: false,
          devOptions: {
            enabled: true,
            type: 'module',
          },
        }),
    ].filter(Boolean),
    build: {
      target: 'esnext',
      outDir: 'dist',
    },
  };
});
