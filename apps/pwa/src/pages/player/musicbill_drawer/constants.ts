import getPublicMusicbill from '@/server/get_public_musicbill';
import { MusicWithIndex } from '../constants';

export type Musicbill = Omit<
  AsyncReturnType<typeof getPublicMusicbill>,
  'collected'
> & {
  musicList: MusicWithIndex[];
};

export const MINI_INFO_HEIGHT = 50;
