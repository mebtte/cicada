import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type ArtistPhoto = {
  id: string;
  asset: string;
  description: string;
};

type Response = {
  total: number;
  artistList: {
    id: string;
    name: string;
    aliases: string[];
    musicCount: number;
    photos: ArtistPhoto[];
  }[];
};

type RawResponse = {
  total: number;
  artistList: (Omit<Response['artistList'][number], 'musicCount' | 'photos'> & {
    musicCount?: number;
    photos?: ArtistPhoto[];
  })[];
};

async function searchArtist({
  keyword,
  page,
  pageSize,
  requestMinimalDuration,
}: {
  keyword: string;
  page: number;
  pageSize: number;
  requestMinimalDuration?: number;
}) {
  const data = await request<RawResponse>({
    path: '/api/artist/search',
    params: { keyword, page, pageSize },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...data,
    artistList: data.artistList.map((artist) => ({
      ...artist,
      musicCount: artist.musicCount ?? 0,
      photos: (artist.photos ?? []).map((photo) => ({
        ...photo,
        asset: prefixServerOrigin(photo.asset),
      })),
    })),
  };
}

export default searchArtist;
