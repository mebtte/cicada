import getOriginalScrollbarWidth from '@/utils/get_original_scrollbar_width';

export const CICADA_START_YEAR = 2016;

export const IS_MAC_OS = navigator.userAgent.toUpperCase().includes('MAC OS');
export const IS_WINDOWS = navigator.userAgent.toUpperCase().includes('WINDOWS');

export enum RequestStatus {
  NOT_START = 'not_start',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export const ORIGINAL_SCROLLBAR_WIDTH = getOriginalScrollbarWidth(); // 浏览器默认滚动条宽度
