import { MusicType } from '../../constants/music';

export interface Response {
  id: string;
  avatar: string;
  joinTimestamp: number;
  nickname: string;
  username: string;
  musicbillList: {
    id: string;
    cover: string;
    name: string;
    musicCount: number;
  }[];
  musicList: {
    id: string;
    type: MusicType;
    name: string;
    aliases: string[];
    cover: string;
    asset: string;
    singers: {
      id: string;
      name: string;
      aliases: string[];
      avatar: string;
    }[];
  }[];
}
