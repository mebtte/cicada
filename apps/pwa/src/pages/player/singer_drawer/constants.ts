import { MusicWithSingerAliases, Index, SingerWithAliases } from '../constants';

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface SingerDetail extends SingerWithAliases {
  avatar: string;
  musicList: (MusicWithSingerAliases & Index)[];
  createUser: CreateUser;
  createTime: string;
}

export const MINI_INFO_HEIGHT = 50;
