import formatMusicFilename from '#/utils/format_music_filename';
import { useCallback } from 'react';
import { saveAs } from 'file-saver';
import { Music as MusicType } from './constants';
import eventemitter, { EventType } from './eventemitter';

export default (
  music: MusicType,
  afterOperate?: (...params: unknown[]) => unknown,
) => {
  const onView = useCallback(
    () => eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id }),
    [music],
  );
  const onPlay = useCallback(() => {
    eventemitter.emit(EventType.ACTION_PLAY_MUSIC, { music });
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onAddToPlayqueue = useCallback(() => {
    eventemitter.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, { music });
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onAddToMusicbill = useCallback(() => {
    eventemitter.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, { music });
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onAddToPlaylist = useCallback(() => {
    eventemitter.emit(EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST, {
      musicList: [music],
    });
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onDownloadSq = useCallback(() => {
    const parts = music.sq.split('.');
    saveAs(
      music.sq,
      formatMusicFilename({
        name: music.name,
        singerNames: music.singers.map((s) => s.name),
        ext: `.${parts[parts.length - 1]}`,
      }),
    );
    return afterOperate && afterOperate();
  }, [afterOperate, music]);
  const onOperate = useCallback(
    () => eventemitter.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, { music }),
    [music],
  );

  return {
    onView,
    onPlay,
    onAddToPlayqueue,
    onAddToMusicbill,
    onAddToPlaylist,
    onDownloadSq,
    onOperate,
  };
};
