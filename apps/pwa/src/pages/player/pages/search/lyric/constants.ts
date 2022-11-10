import { MusicWithIndex } from '@/pages/player/constants';

export interface MusicWithLyric extends MusicWithIndex {
  lrc: string;
}

export const PAGE_SIZE = 20;
