import { MusicWithSingerAliases } from '../../../constants';

export interface MusicWithLyric extends MusicWithSingerAliases {
  lrc: string;
}

export const PAGE_SIZE = 20;
