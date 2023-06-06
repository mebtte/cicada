import { MusicType } from '../../constants/music';

type User = { id: string; nickname: string; avatar: string };

export type Response = {
  id: string;
  cover: string;
  name: string;
  public: boolean;
  createTimestamp: number;
  owner: User;
  sharedUserList: (User & {
    accepted: boolean;
  })[];
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
