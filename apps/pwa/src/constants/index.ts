export enum RequestStatus {
  NOT_START = "not_start",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

export enum Query {
  REDIRECT = "redirect",
  PAGE = "page",
  KEYWORD = "keyword",
  SEARCH_TAB = "search_tab",
  MUSIC_DRAWER_ID = "music_drawer_id",
  ARTIST_DRAWER_ID = "artist_drawer_id",
}

export enum CommonQuery {
  CLIENT_LANGUAGE = "__client_language",
}

export const MINI_MODE_MAX_WIDTH = 720;

/**
 * 禁止修改分隔符
 * 否则数据库数据将异常
 * @author mebtte<i@mebtte.com>
 */
export const ALIAS_DIVIDER = "♫";

export interface Position {
  x: number;
  y: number;
}
