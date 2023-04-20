/* eslint-disable camelcase */
import { MusicType } from '#/constants/music';
import { request } from '..';

interface Singer {
  id: string;
  name: string;
  avatar: string;
  aliases: string[];
}

interface Music {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  aliases: string[];
  asset: string;
  singers: Singer[];
}

/**
 * 获取音乐详情
 * @author mebtte<hi@mebtte.com>
 */
function getMusicDetail(id: string) {
  return request<
    Music & {
      heat: number;
      createTimestamp: number;
      createUser: { id: string; avatar: string; nickname: string };
      forkList: Music[];
      forkFromList: Music[];
    }
  >({
    path: '/api/music_detail',
    params: { id },
    withToken: true,
  });
}

export default getMusicDetail;
