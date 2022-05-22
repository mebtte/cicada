import setting from '@/setting';
import token from '@/global_state/token';

/**
 * 创建音乐播放记录
 * @author mebtte<hi@mebtte.com>
 */
function createMusicPlayRecord({
  musicId,
  percent,
}: {
  musicId: string;
  percent: number;
}) {
  const blob = new Blob(
    [
      JSON.stringify({
        music_id: musicId,
        percent,
        token: token.get(),
      }),
    ],
    {
      type: 'application/json; charset=utf-8',
    },
  );
  return window.navigator.sendBeacon(
    `${setting.getServerAddress()}/api/create_music_play_record`,
    blob,
  );
}

export default createMusicPlayRecord;
