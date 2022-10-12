export const CICADA_START_YEAR = 2016;

export const IS_MAC_OS = navigator.userAgent.toUpperCase().includes('MAC OS');
export const IS_WINDOWS = navigator.userAgent.toUpperCase().includes('WINDOWS');

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
  CREATE_SINGER_DIALOG_OPEN = 'create_singer_dialog_open',
  SEARCH_VALUE = 'search_value',
  PAGE = 'page',
}
