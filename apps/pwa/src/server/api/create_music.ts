import { MusicType } from '@/constants/music';
import { Method, request } from '..';

/**
 * 创建音乐
 * @author mebtte<i@mebtte.com>
 */
function createMusic({
  name,
  singerIds = [],
  lyricistIds = [],
  type,
  asset,
}: {
  name: string;
  singerIds?: string[];
  lyricistIds?: string[];
  type: MusicType;
  asset: string;
}) {
  return request<string>({
    method: Method.POST,
    path: '/api/admin/music',
    body: {
      name,
      singerIds: singerIds.join(','),
      lyricistIds: lyricistIds.join(','),
      type,
      asset,
    },
    withToken: true,
  });
}

export default createMusic;
