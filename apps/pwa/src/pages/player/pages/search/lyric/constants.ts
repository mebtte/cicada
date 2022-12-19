import { MusicWithIndex } from '../../../constants';

export interface MusicWithLyric extends MusicWithIndex {
  lrc: string;
}

export const PAGE_SIZE = 20;
