import { MusicbillSharedStatus } from '../../constants';
import { MusicType } from '../../constants/music';

export type Response = {
  id: string;
  cover: string;
  name: string;
  public: 0 | 1;
  shareStatus: MusicbillSharedStatus;
  createTimestamp: number;
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
