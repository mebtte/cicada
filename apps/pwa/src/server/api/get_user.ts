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
    coverThumbnail?: string;
    name: string;
    musicCount: number;
  }[];
}

/**
 * 获取用户详情
 * @author mebtte<i@mebtte.com>
 */
async function getUser(id: string) {
  const user = await request<Response>({
    path: '/api/common/user',
    params: { userId: id },
    withToken: true,
  });
  return {
    ...user,
    avatar: prefixServerOrigin(user.avatar),
    musicbillList: user.musicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
      coverThumbnail: prefixServerOrigin(mb.coverThumbnail ?? ''),
    })),
  };
}

export default getUser;
