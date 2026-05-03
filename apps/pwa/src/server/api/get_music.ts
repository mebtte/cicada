import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface Singer {
  id: string;
  name: string;
  avatar: string;
}

interface Music {
  id: string;
  cover: string;
  name: string;
  singers: Singer[];
}

type Response = Omit<Music, 'singers'> & {
  type: MusicType;
  aliases: string[];
  heat: number;
  createTimestamp: number;
  createUser: { id: string; nickname: string };
  forkList: Music[];
  forkFromList: Music[];
  year: number | null;
  asset: string;
  musicbillCount: number;
  singers: (Singer & {
    aliases: string[];
  })[];
};

/**
 * 获取音乐详情
 * @author mebtte<i@mebtte.com>
 */
async function getMusic({
  id,
  requestMinimalDuration,
}: {
  id: string;
  requestMinimalDuration?: number;
}) {
  const music = await request<Response>({
    path: '/api/music',
    params: { id },
    withToken: true,
    requestMinimalDuration,
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

export default getMusic;
