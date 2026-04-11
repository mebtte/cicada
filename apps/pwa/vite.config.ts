import path from 'path';
import { fileURLToPath } from 'url';
import cp from 'child_process';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.join(CURRENT_DIR, 'src/static');
const INVALID_FILES = ['.DS_Store'];

function getVersion() {
  try {
    return cp.execSync('git describe --abbrev=0 --tags').toString().trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig(({ command }) => {
  const withSW = command === 'build' || process.env.WITH_SW === 'true';

  return {
    publicDir: STATIC_DIR,
    server: {
      port: 8001,
    },
    resolve: {
      alias: {
        '@': path.resolve(CURRENT_DIR, 'src'),
        '#': path.resolve(CURRENT_DIR, 'src/shared'),
        fs: path.resolve(CURRENT_DIR, 'src/__empty_module.ts'),
        'react-native-fs': path.resolve(CURRENT_DIR, 'src/__empty_module.ts'),
        jsmediatags: path.resolve(
          CURRENT_DIR,
          'node_modules/jsmediatags/dist/jsmediatags.min.js',
        ),
      },
      symlinks: false,
    },
    define: {
      global: 'globalThis',
      __DEFINE__: JSON.stringify({
        VERSION: getVersion(),
        BUILD_TIME: new Date(),
        EMPTY_IMAGE_LIST: fs
          .readdirSync(`${STATIC_DIR}/empty_image`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/empty_image/${f}`),
        ERROR_IMAGE_LIST: fs
          .readdirSync(`${STATIC_DIR}/error_image`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/error_image/${f}`),
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
