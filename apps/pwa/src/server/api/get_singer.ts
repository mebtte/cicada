import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface Response {
  id: string;
  name: string;
  aliases: string[];
  photos: {
    id: string;
    asset: string;
    description: string;
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

type RawResponse = Omit<Response, 'musicList' | 'photos'> & {
  musicList?: Response['musicList'];
  photos?: Response['photos'];
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
  const photos = singer.photos ?? [];
  return {
    id: singer.id,
    name: singer.name,
    aliases: singer.aliases ?? [],
    photos: photos.map((p) => ({
      ...p,
      asset: prefixServerOrigin(p.asset),
    })),
    musicList: musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getSinger;
