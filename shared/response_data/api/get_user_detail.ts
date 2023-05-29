import { MusicType } from '../../constants/music';

type GetUserDetail = {
  id: string;
  avatar: string;
  joinTimestamp: number;
  nickname: string;
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
    }[];
  }[];
};

export default GetUserDetail;
