import { Response } from '#/server/api/get_musicbill_list';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

async function getMusicbillList({
  requestMinimalDuration,
}: {
  requestMinimalDuration: number;
}) {
  const musicbillList = await request<Response>({
    path: '/api/musicbill_list',
    withToken: true,
    requestMinimalDuration,
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
