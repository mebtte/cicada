import { request } from '.';

async function getPublicMusicbill(id: string) {
  return request<{
    id: string;
    cover: string;
    name: string;
    createTimestamp: number;
  }>({
    path: '/api/public_musicbill',
    params: { id },
    withToken: true,
  });
}

export default getPublicMusicbill;
