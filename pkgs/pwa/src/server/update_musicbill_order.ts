import api from '.';

/**
 * 更新歌单排序
 * @author mebtte<hi@mebtte.com>
 */
function updateMusicbillOrder(orderedMusicbillIdList: string[]) {
  return api.post<void>('/api/update_musicbill_order', {
    data: {
      ordered_musicbill_id_list: orderedMusicbillIdList,
    },
    withToken: true,
  });
}

export default updateMusicbillOrder;
