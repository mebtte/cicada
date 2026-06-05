export const SEARCH_KEYWORD_MAX_LENGTH = 32;

export const NAME_MAX_LENGTH = 64;

export const SINGER_ALIAS_MAX_COUNT = 5;
export const ALIAS_MAX_LENGTH = 64;
export const SEARCH_KEYWORDS_MAX_LENGTH = 4000;

export enum AllowUpdateKey {
  AVATAR = 'avatar',
  NAME = 'name',
  ALIASES = 'aliases',
  SEARCH_KEYWORDS = 'searchKeywords',
}

/**
 * 没有挂载音乐保存时间
 * @author mebtte<i@mebtte.com>
 */
export const NO_MUSIC_EXIST_DURATION = 1000 * 60 * 60 * 24 * 3;

export const SINGER_MODIFY_RECORD_TTL = 1000 * 60 * 60 * 24 * 180;
