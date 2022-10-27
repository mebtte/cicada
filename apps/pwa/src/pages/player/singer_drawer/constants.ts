import { MusicWithIndex, Singer } from '../constants';

export interface CreataUser {
  id: string;
  nickname: string;
}

export interface SingerDetail extends Singer {
  musicList: MusicWithIndex[];
  createUser: CreataUser;
  createTime: string;
}

export const MINI_INFO_HEIGHT = 50;
