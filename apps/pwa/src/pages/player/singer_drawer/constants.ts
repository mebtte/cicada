import { MusicWithIndex, Singer } from '../constants';

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface SingerDetail extends Singer {
  avatar: string;
  musicList: MusicWithIndex[];
  createUser: CreateUser;
  createTime: string;
}

export const MINI_INFO_HEIGHT = 50;
