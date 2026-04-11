import { Response } from '#/server/api/get_singer';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type RawResponse = Omit<Response, 'createUser' | 'musicList' | 'editable'> & {
  createUser?: Response['createUser'];
  musicList?: Response['musicList'];
  editable?: boolean;
};

/**
 * 获取歌手详情
 * @author mebtte<i@mebtte.com>
 */
async function getSinger(id: string): Promise<Response> {
  const singer = await request<RawResponse>({
    path: '/api/singer',
    params: { id },
    withToken: true,
  });
  const musicList = singer.musicList ?? [];
  return {
    ...singer,
    aliases: singer.aliases ?? [],
    avatar: prefixServerOrigin(singer.avatar ?? ''),
    createUser: singer.createUser ?? { id: '', nickname: '' },
    editable: singer.editable ?? false,
    musicList: musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getSinger;
