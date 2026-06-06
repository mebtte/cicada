import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(CURRENT_DIR, '../src');
const STATIC_DIR = path.resolve(SRC_DIR, 'static');

const config: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/features/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@': SRC_DIR,
      '#': path.resolve(SRC_DIR, 'shared'),
    };

    config.define = {
      ...config.define,
      global: 'globalThis',
      __DEFINE__: JSON.stringify({
        VERSION: 'storybook',
        BUILD_TIME: new Date().toISOString(),
        EMPTY_IMAGE_LIST: [],
        ERROR_IMAGE_LIST: [],
      }),
    };

    config.publicDir = STATIC_DIR;

    return config;
  },
};

export default config;
