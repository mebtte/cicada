import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
  id: string;
  cover: string;
  name: string;
  public: boolean;
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
    coverThumbnail?: string;
    asset: string;
    performers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    lyricists: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    composers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
  }[];

  collected: boolean;
};

/**
 * 获取公开乐单详情
 * @author mebtte<i@mebtte.com>
 */
async function getPublicMusicbill(id: string) {
  const musicbill = await request<Response>({
    path: '/api/common/public_musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      coverThumbnail: prefixServerOrigin(m.coverThumbnail ?? ''),
      asset: prefixServerOrigin(m.asset),
      lyricists: m.lyricists ?? [],
      composers: m.composers ?? [],
    })),
    user: {
      ...musicbill.user,
      avatar: prefixServerOrigin(musicbill.user.avatar),
    },
  };
}

export default getPublicMusicbill;
