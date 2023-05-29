/* eslint-disable camelcase */
import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

interface Singer {
  id: string;
  name: string;
  avatar: string;
  aliases: string[];
}

interface Music {
  id: string;
  cover: string;
  name: string;
  singers: Singer[];
}

/**
 * 获取音乐详情
 * @author mebtte<hi@mebtte.com>
 */
async function getMusicDetail(id: string) {
  const music = await request<
    Music & {
      type: MusicType;
      aliases: string[];
      heat: number;
      createTimestamp: number;
      createUser: { id: string; avatar: string; nickname: string };
      forkList: Music[];
      forkFromList: Music[];
      year: number | null;
      asset: string;
      musicbillCount: number;
    }
  >({
    path: '/api/music_detail',
    params: { id },
    withToken: true,
  });
  return {
    ...music,
    cover: prefixServerOrigin(music.cover),
    asset: prefixServerOrigin(music.asset),
    singers: music.singers.map((s) => ({
      ...s,
      avatar: prefixServerOrigin(s.avatar),
    })),
    forkList: music.forkList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
    })),
    forkFromList: music.forkFromList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
    })),
  };
}

export default getMusicDetail;
