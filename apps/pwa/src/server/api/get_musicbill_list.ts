import { Response } from '#/server/api/get_musicbill_list';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function getMusicbillList() {
  const musicbillList = await request<Response>({
    path: '/api/musicbill_list',
    withToken: true,
  });
  return musicbillList.map((mb) => ({
    ...mb,
    cover: prefixServerOrigin(mb.cover),
  }));
}

export default getMusicbillList;
