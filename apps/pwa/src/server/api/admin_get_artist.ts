import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface Response {
  id: string;
  name: string;
  aliases: string[];
  searchKeywords: string;
  photos: {
    id: string;
    asset: string;
    description: string;
  }[];
  musicCount: number;
  createUser: {
    id: string;
    username: string;
    nickname: string;
  };
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
      asset: prefixServerOrigin(photo.asset),
    })),
  };
}

export default adminGetArtist;
