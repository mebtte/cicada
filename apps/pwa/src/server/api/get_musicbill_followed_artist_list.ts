import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type ArtistPhoto = {
  id: string;
  asset: string;
  thumbnail?: string;
  description: string;
};

type FollowedArtist = {
  id: string;
  name: string;
  aliases: string[];
  photos: ArtistPhoto[];
};

type RawResponse = (Omit<FollowedArtist, 'photos'> & {
  photos?: ArtistPhoto[];
})[];

async function getMusicbillFollowedArtistList({
  musicbillId,
}: {
  musicbillId: string;
}) {
  const data = await request<RawResponse>({
    path: '/api/musicbill/followed_artist',
    withToken: true,
    params: { musicbillId },
  });
  return data.map((artist) => ({
    ...artist,
    photos: (artist.photos ?? []).map((photo) => ({
      ...photo,
      asset: prefixServerOrigin(photo.asset),
      thumbnail: prefixServerOrigin(photo.thumbnail ?? ''),
    })),
  }));
}

export default getMusicbillFollowedArtistList;
