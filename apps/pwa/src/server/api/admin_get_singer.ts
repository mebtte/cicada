import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface Response {
  id: string;
  name: string;
  aliases: string[];
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

async function adminGetSinger(id: string): Promise<Response> {
  const singer = await request<Response>({
    path: '/api/admin/singer',
    params: { id },
    withToken: true,
    requestMinimalDuration: 0,
  });
  return {
    ...singer,
    aliases: singer.aliases ?? [],
    photos: (singer.photos ?? []).map((photo) => ({
      ...photo,
      asset: prefixServerOrigin(photo.asset),
    })),
  };
}

export default adminGetSinger;
