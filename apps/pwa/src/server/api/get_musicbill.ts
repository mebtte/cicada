import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

interface Response {
  id: string;
  cover: string;
  name: string;
  public: boolean;
  createTimestamp: number;
  owner: User;
  sharedUserList: (User & {
    accepted: boolean;
  })[];
  musicList: {
    id: string;
    type: MusicType;
    name: string;
    aliases: string[];
    cover: string;
    coverThumbnail?: string;
    asset: string;
    singers: {
      id: string;
      name: string;
      aliases: string[];
      avatar: string;
    }[];
    lyricists: {
      id: string;
      name: string;
      aliases: string[];
      avatar: string;
    }[];
  }[];
}

/**
 * 获取乐单
 * @author mebtte<i@mebtte.com>
 */
async function getMusicbill(id: string) {
  const musicbill = await request<Response>({
    path: '/api/musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
    owner: {
      ...musicbill.owner,
      avatar: prefixServerOrigin(musicbill.owner.avatar),
    },
    sharedUserList: musicbill.sharedUserList.map((u) => ({
      ...u,
      avatar: prefixServerOrigin(u.avatar),
    })),
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      coverThumbnail: prefixServerOrigin(m.coverThumbnail ?? ''),
      asset: prefixServerOrigin(m.asset),
      lyricists: m.lyricists ?? [],
    })),
  };
}

export default getMusicbill;
