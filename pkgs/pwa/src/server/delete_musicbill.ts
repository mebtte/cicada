import api from '.';

/**
 * 删除歌单
 * @author mebtte<hi@mebtte.com>
 */
function deleteMusicbill(id: string) {
  return api.get('/api/delete_musicbill', {
    params: { id },
    withToken: true,
  });
}

export default deleteMusicbill;
