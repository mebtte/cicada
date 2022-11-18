import getPublicMusicbill from '@/server/get_public_musicbill';

export type Musicbill = AsyncReturnType<typeof getPublicMusicbill>;

export const MINI_INFO_HEIGHT = 50;
