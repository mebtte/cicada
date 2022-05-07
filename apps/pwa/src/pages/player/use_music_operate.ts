import { useCallback } from 'react';

import openLink from '@/utils/open_link';
import dialog from '@/platform/dialog';
import toast from '@/platform/toast';
import { Music as MusicType } from './constants';
import eventemitter, { EventType } from './eventemitter';

export default (music: MusicType, afterOperate?: (...params: any[]) => any) => {
  const onView = useCallback(
    () => eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, music),
    [music],
  );
  const onPlay = useCallback(() => {
    eventemitter.emit(EventType.ACTION_PLAY_MUSIC, music);
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onAddToPlayqueue = useCallback(() => {
    eventemitter.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, music);
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onAddToMusicbill = useCallback(() => {
    eventemitter.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, music);
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
  const onWatchMv = useCallback(() => {
    eventemitter.emit(EventType.ACTION_PAUSE, {});
    openLink(music.mvLink);
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);
  const onOperate = useCallback(
    () => eventemitter.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, music),
    [music],
  );
  const onCopyID = useCallback(() => {
    window.navigator.clipboard
      .writeText(music.id)
      .then(() => toast.success(`已复制「${music.id}」`))
      .catch((error) =>
        dialog.alert({
          title: '复制失败',
          content: error.message,
        }),
      );
    if (afterOperate) {
      afterOperate();
    }
  }, [music, afterOperate]);

  return {
    onView,
    onPlay,
    onAddToPlayqueue,
    onAddToMusicbill,
    onAddToPlaylist,
    onWatchMv,
    onOperate,
    onCopyID,
  };
};
