import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

async function getUserDetail(id: string) {
  const user = await request<{
    id: string;
    avatar: string;
    joinTimestamp: number;
    nickname: string;
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
    path: '/api/user_detail',
    params: { id },
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
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
  };
}

export default getUserDetail;
