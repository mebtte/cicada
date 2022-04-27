/* eslint-disable camelcase */
import { MusicType } from '@/constants/music';
import server from '.';

interface Singer {
  id: string;
  name: string;
  avatar: string;
  alias: string;
}

interface Music {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  alias: string;
  ac: string;
  hq: string;
  mv_link: string;
  sq: string;
  singers: Singer[];
  fork: string[];
  fork_from: string[];
}

/**
 * 获取音乐详情
 * @author mebtte<hi@mebtte.com>
 */
function getMusicDetail(id: string) {
  return server.get<
    Omit<Music, 'fork' | 'fork_from'> & {
      fork: Music[];
      fork_from: Music[];
      lrc: string;
    }
  >('/api/get_music_detail', {
    withToken: true,
    params: { id },
  });
}

export default getMusicDetail;
