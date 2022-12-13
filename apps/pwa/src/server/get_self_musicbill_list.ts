import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

async function getSelfMusicbillList() {
  const musicbillList = await request<
    {
      id: string;
      cover: string;
      name: string;
      public: 0 | 1;
      createTimestamp: number;
    }[]
  >({
    path: '/api/self_musicbill_list',
    withToken: true,
  });
  return musicbillList.map((mb) => ({
    ...mb,
    cover: prefixServerOrigin(mb.cover),
  }));
}

export default getSelfMusicbillList;
