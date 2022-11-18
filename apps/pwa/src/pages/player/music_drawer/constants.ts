import { Music, Singer } from '../constants';

export interface Lyric {
  id: number;
  lrc: string;
}

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface SingerDetail extends Singer {
  avatar: string;
}

export interface MusicDetail extends Music {
  lyrics: Lyric[];
  createUser: CreateUser;
  createTime: string;
  forkFromList: Music[];
  forkList: Music[];
  singers: SingerDetail[];
}

export const MINI_INFO_HEIGHT = 50;
