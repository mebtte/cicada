/* eslint-disable camelcase */
import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

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
  type: MusicType;
  aliases: string[];
  sq: string;
  hq: string;
  ac: string;
  singers: Singer[];
}

/**
 * 获取音乐详情
 * @author mebtte<hi@mebtte.com>
 */
async function getMusicDetail(id: string) {
  const music = await request<
    Music & {
      createTimestamp: number;
      createUser: { id: string; avatar: string; nickname: string };
      forkList: Music[];
      forkFromList: Music[];
    }
  >({
    path: '/api/music_detail',
    params: { id },
    withToken: true,
  });
  return {
    ...music,
    singers: music.singers.map((s) => ({
      ...s,
      avatar: prefixServerOrigin(s.avatar),
    })),
    cover: prefixServerOrigin(music.cover),
    sq: prefixServerOrigin(music.sq),
    hq: prefixServerOrigin(music.hq),
    ac: prefixServerOrigin(music.ac),
    forkList: music.forkList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
    forkFromList: music.forkFromList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
  };
}

export default getMusicDetail;
