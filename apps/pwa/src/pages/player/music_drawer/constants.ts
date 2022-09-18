import { Music as BaseMusic } from '../constants';

export const COVER_SIZE = 320;
export const PADDING = 20;

export interface Lyric {
  id: number;
  content: string;
}

export type Music = Omit<BaseMusic, 'fork' | 'forkFrom'> & {
  fork: BaseMusic[];
  forkFrom: BaseMusic[];
  lyrics: Lyric[] | null;
};

export type Data =
  | { error: Error; loading: false; music: null }
  | { error: null; loading: true; music: null }
  | {
      error: null;
      loading: false;
      music: Music;
    };
