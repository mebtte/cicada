import { resolveServerURL } from '@/global_states/server';
import { request } from '..';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

type Response = {
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
}[];

async function getMusicbillList() {
  const musicbillList = await request<Response>({
    path: '/api/common/musicbill_list',
    withToken: true,
  });
  return musicbillList.map((mb) => ({
    ...mb,
    cover: resolveServerURL(mb.cover),
    coverThumbnail: resolveServerURL(mb.coverThumbnail ?? ''),
    owner: {
      ...mb.owner,
      avatar: resolveServerURL(mb.owner.avatar),
    },
    sharedUserList: mb.sharedUserList.map((u) => ({
      ...u,
      avatar: resolveServerURL(u.avatar),
    })),
  }));
}

export default getMusicbillList;
