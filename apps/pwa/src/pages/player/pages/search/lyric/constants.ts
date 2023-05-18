import { MusicWithSingerAliases, Index } from '../../../constants';

export interface MusicWithLyric extends MusicWithSingerAliases, Index {
  lrc: string;
}

export const PAGE_SIZE = 20;
