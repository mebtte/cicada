import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

async function getSelfMusicbill(id: string) {
  const musicbill = await request<{
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
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
  };
}

export default getSelfMusicbill;
