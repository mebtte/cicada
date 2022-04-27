import api from '.';

/**
 * 添加音乐到歌单
 * @author mebtte<hi@mebtte.com>
 */
function addMusicToMusicbill({
  musicbillId,
  musicId,
}: {
  musicbillId: string;
  musicId: string;
}) {
  return api.post<void>('/api/add_music_to_musicbill', {
    data: {
      musicbill_id: musicbillId,
      music_id: musicId,
    },
    withToken: true,
  });
}

export default addMusicToMusicbill;
