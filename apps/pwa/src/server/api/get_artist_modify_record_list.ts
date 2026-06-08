import { request } from '..';

type Response = {
  id: number;
  key: string;
  modifyUserId: string;
  modifyUserNickname: string;
  modifyTimestamp: number;
}[];

/**
 * 获取歌手修改记录列表
 * @author mebtte<i@mebtte.com>
 */
function getArtistModifyRecordList({
  id,
  requestMinimalDuration,
}: {
  id: string;
  requestMinimalDuration?: number;
}) {
  return request<Response>({
    path: '/api/artist_modify_record_list',
    withToken: true,
    params: { id },
    requestMinimalDuration,
  });
}

export default getArtistModifyRecordList;
