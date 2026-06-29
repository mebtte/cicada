import getArtist from '@/server/api/get_artist';

export type Artist = AsyncReturnType<typeof getArtist>;
