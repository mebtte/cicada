/* eslint-disable camelcase */
import { MusicType } from '#/constants/music';
import { request } from '.';

interface Singer {
  id: string;
  name: string;
  avatar: string;
  aliases: string;
}

interface Music {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  aliases: string[];
  ac: string;
  hq: string;
  mv_link: string;
  sq: string;
  singers: Singer[];
}

/**
 * 获取音乐详情
 * @author mebtte<hi@mebtte.com>
 */
function getMusicDetail(id: string) {
  return request<
    Music & {
      createUser: { id: string; avatar: string; nickname: string };
      lyric?: string;
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
