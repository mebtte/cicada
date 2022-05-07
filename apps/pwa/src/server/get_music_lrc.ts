import api from '.';

/**
 * 获取歌词
 * @author mebtte<hi@mebtte.com>
 */
function getMusicLrc({ musicId, defer }: { musicId: string; defer?: number }) {
  return api.get<string>('/api/get_music_lrc', {
    params: { music_id: musicId },
    withToken: true,
    defer,
  });
}

export default getMusicLrc;
