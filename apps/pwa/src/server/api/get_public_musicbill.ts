import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function getPublicMusicbill(id: string) {
  const musicbill = await request<{
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

    collected: boolean;
  }>({
    path: '/api/public_musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
    user: {
      ...musicbill.user,
      avatar: prefixServerOrigin(musicbill.user.avatar),
    },
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
  };
}

export default getPublicMusicbill;
