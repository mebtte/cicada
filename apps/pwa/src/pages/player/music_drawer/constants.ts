import { Music, SingerWithAliases } from '../constants';

export interface Lyric {
  id: number;
  lrc: string;
}

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface SingerDetail extends SingerWithAliases {
  avatar: string;
}

export interface MusicDetail extends Music {
  heat: number;
  lyrics: Lyric[];
  createUser: CreateUser;
  createTime: string;
  forkFromList: Omit<Music, 'asset' | 'type' | 'aliases'>[];
  forkList: Omit<Music, 'asset' | 'type' | 'aliases'>[];
  singers: SingerDetail[];
  year: number | null;
  musicbillCount: number;

  size: number;
  duration: number;
}
