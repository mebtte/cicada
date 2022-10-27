import { Music } from '../constants';

export interface Lyric {
  id: number;
  content: string;
}

export interface MusicDetail extends Music {
  lyrics: Lyric[];
}
