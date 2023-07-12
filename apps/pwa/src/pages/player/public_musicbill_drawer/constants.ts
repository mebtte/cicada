import getPublicMusicbill from '@/server/api/get_public_musicbill';

export type Musicbill = AsyncReturnType<typeof getPublicMusicbill>;

export const TOOLBAR_HEIGHT = 50;
