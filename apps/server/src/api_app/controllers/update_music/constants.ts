import { Context } from '@/constants/koa';
import { Music as MusicFull, Property } from '@/db/music';

export type Music = Pick<MusicFull, Property.ID | Property.COVER>;

export interface Parameter {
  ctx: Context;
  music: Music;
  value: unknown;
}
