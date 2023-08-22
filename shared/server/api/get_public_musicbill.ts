import { MusicType } from '../../constants/music';

export type Response = {
  id: string;
  cover: string;
  name: string;
  user: {
    id: string;
    nickname: string;
  };
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

  collected: boolean;
};
