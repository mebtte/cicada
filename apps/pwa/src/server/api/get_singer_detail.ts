import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 获取歌手详情
 * @author mebtte<hi@mebtte.com>
 */
async function getSingerDetail(id: string) {
  const singer = await request<{
    id: string;
    avatar: string;
    name: string;
    aliases: string[];
    createTimestamp: number;
    createUser: {
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
    path: '/api/singer_detail',
    params: { id },
    withToken: true,
  });

  return {
    ...singer,
    avatar: prefixServerOrigin(singer.avatar),
    createUser: {
      ...singer.createUser,
      avatar: prefixServerOrigin(singer.createUser.avatar),
    },
    musicList: singer.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
  };
}

export default getSingerDetail;
