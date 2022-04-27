import getOriginalScrollbarWidth from '@/utils/get_original_scrollbar_width';

export const CICADA_START_YEAR = 2016;

export const IS_ELECTRON = !!window.require;
export const IS_MAC_OS = navigator.userAgent.toUpperCase().includes('MAC OS');
export const IS_WINDOWS = navigator.userAgent.toUpperCase().includes('WINDOWS');

export enum RequestStatus {
  NOT_START = 'not_start',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export const ORIGINAL_SCROLLBAR_WIDTH = getOriginalScrollbarWidth(); // 浏览器默认滚动条宽度

export const PWA_GITHUB_REPOSITORY = 'https://github.com/mebtte/cicada_pwa';
export const ELECTRON_GITHUB_REPOSITORY =
  'https://github.com/mebtte/cicada_electron';
export const EXPO_GITHUB_REPOSITORY = 'https://github.com/mebtte/cicada_expo';
export const SERVER_GITHUB_REPOSITORY =
  'https://github.com/mebtte/cicada_server';
