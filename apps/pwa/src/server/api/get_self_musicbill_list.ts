import { Response } from '#/server/api/get_self_musicbill_list';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function getSelfMusicbillList() {
  const musicbillList = await request<Response>({
    path: '/api/self_musicbill_list',
    withToken: true,
  });
  return musicbillList.map((mb) => ({
    ...mb,
    cover: prefixServerOrigin(mb.cover),
  }));
}

export default getSelfMusicbillList;
