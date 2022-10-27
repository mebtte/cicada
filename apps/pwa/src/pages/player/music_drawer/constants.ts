import { Music } from '../constants';

export interface Lyric {
  id: number;
  content: string;
}

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface MusicDetail extends Music {
  lyrics: Lyric[];
  createUser: CreateUser;
  createTime: string;
}

export const MINI_INFO_HEIGHT = 50;
