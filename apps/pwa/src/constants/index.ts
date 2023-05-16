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
  MUSIC_DRAWER_ID = 'music_drawer_id',
  SINGER_DRAWER_ID = 'singer_drawer_id',
}

export enum PlayMode {
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
}
