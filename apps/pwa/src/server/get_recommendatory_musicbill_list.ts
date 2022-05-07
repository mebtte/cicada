import server from '.';

/**
 * 获取推荐歌单列表
 * @author mebtte<hi@mebtte.com>
 */
function getRecommendatoryMusicbillList() {
  return server.get<{ id: string; cover: string; name: string }[]>(
    '/api/get_recommendatory_musicbill_list',
    {
      withToken: true,
    },
  );
}

export default getRecommendatoryMusicbillList;
