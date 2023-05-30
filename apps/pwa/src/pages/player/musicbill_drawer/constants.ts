import getPublicMusicbill from '@/server/api/get_public_musicbill';
import { MusicWithSingerAliases, Index } from '../constants';

export type Musicbill = Omit<
  AsyncReturnType<typeof getPublicMusicbill>,
  'collected'
> & {
  musicList: (MusicWithSingerAliases & Index)[];
  collectionCount: number;
};

export const MINI_INFO_HEIGHT = 50;
