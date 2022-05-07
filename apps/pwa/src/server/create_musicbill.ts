import api from '.';

/**
 * 创建歌单
 * @author mebtte <hi@mebtte.com>
 */
function createMusicbill(name: string) {
  return api.post<{
    id: string;
    name: string;
    order: number;
    // eslint-disable-next-line camelcase
    create_time: string;
  }>('/api/create_musicbill', { withToken: true, data: { name } });
}

export default createMusicbill;
