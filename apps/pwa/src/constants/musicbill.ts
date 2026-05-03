export const NAME_MAX_LENGTH = 64;

export enum AllowUpdateKey {
  COVER = 'cover',
  NAME = 'name',
  PUBLIC = 'public',
}

export const SEARCH_KEYWORD_MAX_LENGTH = 32;

/**
 * 共享乐单邀请最小存活时间
 * @author mebtte<i@mebtte.com>
 */
export const SHARED_MUSICBILL_INVITATION_MINIMAL_TTL = 1000 * 60 * 60 * 24 * 3;
