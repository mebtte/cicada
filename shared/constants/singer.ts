export const SEARCH_KEYWORD_MAX_LENGTH = 12;

export const NAME_MAX_LENGTH = 32;

export const SINGER_ALIAS_MAX_COUNT = 5;
export const ALIAS_MAX_LENGTH = 32;

export enum AllowUpdateKey {
  AVATAR = 'avatar',
  NAME = 'name',
  ALIASES = 'aliases',
}

/**
 * 没有挂载音乐保存时间
 * @author mebtte<hi@mebtte.com>
 */
export const NO_MUSIC_EXIST_DURATION = 1000 * 60 * 60 * 24 * 3;
