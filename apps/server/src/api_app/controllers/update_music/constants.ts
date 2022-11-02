import { Context } from '@/constants/koa';
import { Music as MusicFull, Property } from '@/db/music';

export type Music = Pick<
  MusicFull,
  | Property.ID
  | Property.COVER
  | Property.CREATE_USER_ID
  | Property.NAME
  | Property.ALIASES
  | Property.TYPE
  | Property.SQ
  | Property.HQ
  | Property.AC
>;

export interface Parameter {
  ctx: Context;
  music: Music;
  value: unknown;
}
