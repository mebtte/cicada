import { MusicType } from '#/constants/music';
import { request } from '.';

async function getPublicMusicbill(id: string) {
  return request<{
    id: string;
    cover: string;
    name: string;
    createTimestamp: number;
    user: {
      id: string;
      nickname: string;
      avatar: string;
    };
    musicList: {
      id: string;
      type: MusicType;
      name: string;
      aliases: string[];
      cover: string;
      sq: string;
      hq: string;
      ac: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
    }[];
  }>({
    path: '/api/public_musicbill',
    params: { id },
    withToken: true,
  });
}

export default getPublicMusicbill;
