import { MusicType } from '@/constants/music';
import { resolveServerURL } from '@/global_states/server';
import { request } from '..';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

interface Response {
  id: string;
  cover: string;
  coverThumbnail?: string;
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
    performers: {
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
    composers: {
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
    path: '/api/common/musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: resolveServerURL(musicbill.cover),
    coverThumbnail: resolveServerURL(musicbill.coverThumbnail ?? ''),
    owner: {
      ...musicbill.owner,
      avatar: resolveServerURL(musicbill.owner.avatar),
    },
    sharedUserList: musicbill.sharedUserList.map((u) => ({
      ...u,
      avatar: resolveServerURL(u.avatar),
    })),
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: resolveServerURL(m.cover),
      coverThumbnail: resolveServerURL(m.coverThumbnail ?? ''),
      asset: resolveServerURL(m.asset),
      lyricists: m.lyricists ?? [],
      composers: m.composers ?? [],
    })),
  };
}

export default getMusicbill;
