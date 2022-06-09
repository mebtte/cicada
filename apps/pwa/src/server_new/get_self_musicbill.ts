import { Character } from '@/constants/character';
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
      type: 1 | 2;
      name: string;
      alias: string;
      cover: string;
      sq: string;
      hq: string;
      ac: string;
      singers: Character[];
    }[];
  }>({
    path: '/api/self_musicbill',
    params: { id },
    withToken: true,
  });
}

export default getSelfMusicbill;
