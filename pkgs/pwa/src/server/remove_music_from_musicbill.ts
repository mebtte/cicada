import server from '.';

/**
 * 从歌单移除音乐
 * @author mebtte<hi@mebtte.com>
 */
function removeMusicFromMusicbill({
  musicbillId,
  musicId,
}: {
  musicbillId: string;
  musicId: string;
}) {
  return server.get('/api/remove_music_from_musicbill', {
    params: {
      musicbill_id: musicbillId,
      music_id: musicId,
    },
    withToken: true,
  });
}

export default removeMusicFromMusicbill;
