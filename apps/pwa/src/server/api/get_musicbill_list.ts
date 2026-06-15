import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

type Response = {
  id: string;
  cover: string;
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
    path: '/api/musicbill_list',
    withToken: true,
  });
  return musicbillList.map((mb) => ({
    ...mb,
    cover: prefixServerOrigin(mb.cover),
    owner: {
      ...mb.owner,
      avatar: prefixServerOrigin(mb.owner.avatar),
    },
    sharedUserList: mb.sharedUserList.map((u) => ({
      ...u,
      avatar: prefixServerOrigin(u.avatar),
    })),
  }));
}

export default getMusicbillList;
