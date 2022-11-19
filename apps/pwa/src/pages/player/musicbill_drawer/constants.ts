import getPublicMusicbill from '@/server/get_public_musicbill';
import { MusicWithIndex } from '../constants';

export type Musicbill = AsyncReturnType<typeof getPublicMusicbill> & {
  musicList: MusicWithIndex[];
};

export const MINI_INFO_HEIGHT = 50;
