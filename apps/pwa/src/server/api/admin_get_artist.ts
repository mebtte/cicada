import { resolveServerURL } from '@/global_states/server';
import { request } from '..';

interface Response {
  id: string;
  name: string;
  aliases: string[];
  searchKeywords: string;
  photos: {
    id: string;
    asset: string;
    thumbnail?: string;
    description: string;
  }[];
  musicCount: number;
  createTimestamp: number;
}

async function adminGetArtist(id: string): Promise<Response> {
  const artist = await request<Response>({
    path: '/api/admin/artist',
    params: { id },
    withToken: true,
    requestMinimalDuration: 0,
  });
  return {
    ...artist,
    aliases: artist.aliases ?? [],
    searchKeywords: artist.searchKeywords ?? '',
    photos: (artist.photos ?? []).map((photo) => ({
      ...photo,
      asset: resolveServerURL(photo.asset),
      thumbnail: resolveServerURL(photo.thumbnail ?? ''),
    })),
  };
}

export default adminGetArtist;
