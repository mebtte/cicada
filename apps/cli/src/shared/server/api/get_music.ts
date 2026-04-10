import { MusicType } from '../../constants/music';

interface Singer {
  id: string;
  name: string;
  avatar: string;
}

interface Music {
  id: string;
  cover: string;
  name: string;
  singers: Singer[];
}

export type Response = Omit<Music, 'singers'> & {
  type: MusicType;
  aliases: string[];
  heat: number;
  createTimestamp: number;
  createUser: { id: string; nickname: string };
  forkList: Music[];
  forkFromList: Music[];
  year: number | null;
  asset: string;
  musicbillCount: number;
  singers: (Singer & {
    aliases: string[];
  })[];
};
