import { MusicType } from '#/constants/music';
import { request } from '.';

function getSelfMusicbill(id: string) {
  return request<{
    id: string;
    cover: string;
    name: string;
    public: 0 | 1;
    createTimestamp: number;
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
    path: '/api/self_musicbill',
    params: { id },
    withToken: true,
  });
}

export default getSelfMusicbill;
