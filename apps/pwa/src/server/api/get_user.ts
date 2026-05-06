import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface Response {
  id: string;
  avatar: string;
  joinTimestamp: number;
  nickname: string;
  username: string;
  musicbillList: {
    id: string;
    cover: string;
    name: string;
    musicCount: number;
  }[];
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
      avatar: string;
    }[];
  }[];
}

/**
 * 获取用户详情
 * @author mebtte<i@mebtte.com>
 */
async function getUser(id: string) {
  const user = await request<Response>({
    path: '/api/user',
    params: { uid: id },
    withToken: true,
  });
  return {
    ...user,
    avatar: prefixServerOrigin(user.avatar),
    musicbillList: user.musicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
    })),
    musicList: user.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getUser;
