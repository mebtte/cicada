import { Music as MusicFull, MusicProperty } from '@/constants/db_definition';
import { Context } from '@/constants/koa';

export type Music = Pick<
  MusicFull,
  | MusicProperty.ID
  | MusicProperty.COVER
  | MusicProperty.CREATE_USER_ID
  | MusicProperty.NAME
  | MusicProperty.ALIASES
  | MusicProperty.TYPE
  | MusicProperty.ASSET
  | MusicProperty.YEAR
>;

export interface Parameter {
  ctx: Context;
  music: Music;
  value: unknown;
}
