import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 获取公开乐单详情
 * @author mebtte<hi@mebtte.com>
 */
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
      asset: string;
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
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
    user: {
      ...musicbill.user,
      avatar: prefixServerOrigin(musicbill.user.avatar),
    },
  };
}

export default getPublicMusicbill;
