export const CICADA_START_YEAR = 2016;

export const IS_TOUCHABLE =
  'ontouchstart' in window || window.navigator.maxTouchPoints > 0;

export const IS_MAC_OS =
  navigator.userAgent.toLowerCase().includes('mac os') && !IS_TOUCHABLE;
export const IS_WINDOWS = navigator.userAgent.toLowerCase().includes('windows');
export const IS_IPAD =
  navigator.userAgent.toLowerCase().includes('mac os') && IS_TOUCHABLE;
export const IS_IPHONE = navigator.userAgent.toLowerCase().includes('iphone');

export enum RequestStatus {
  NOT_START = 'not_start',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum Query {
  VERSION = '__v',

  REDIRECT = 'redirect',
  CREATE_MUSIC_DIALOG_OPEN = 'create_music_dialog_open',
  PAGE = 'page',
  KEYWORD = 'keyword',
  SEARCH_TAB = 'search_tab',
}

export enum PlayMode {
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
}
