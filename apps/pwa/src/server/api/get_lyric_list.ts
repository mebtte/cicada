import { request } from '..';

function getLyricList({
  musicId,
  requestMinimalDuration = 1000,
}: {
  musicId: string;
  requestMinimalDuration?: number;
}) {
  return request<
    {
      id: number;
      lrc: string;
    }[]
  >({
    path: '/api/lyric_list',
    params: { musicId },
    withToken: true,
    requestMinimalDuration,
  });
}

export default getLyricList;
