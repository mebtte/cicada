import { useState, useEffect } from 'react';

import { Music, MusicWithIndex } from './constants';
import eventemitter, { EventType } from './eventemitter';
import toast from '../../platform/toast';

export default () => {
  const [playlist, setPlaylist] = useState<MusicWithIndex[]>([]);

  useEffect(() => {
    // 指定音乐播放
    const onPlayMusicListener = (music: Music) =>
      setPlaylist((pl) => {
        const musicIdList = pl.map((m) => m.music.id);
        if (musicIdList.includes(music.id)) {
          return pl;
        }
        const newPlaylist = [{ index: 0, music }, ...pl];
        const { length } = newPlaylist;
        return newPlaylist.map((m, index) => ({
          music: m.music,
          index: length - index,
        }));
      });

    // 添加音乐列表到播放列表
    const onAddMusicListToPlaylistListener = ({
      musicList,
    }: {
      musicList: Music[];
    }) =>
      setPlaylist((pl) => {
        const currentMusicIdList = pl.map((m) => m.music.id);
        const newMusicList = musicList.filter(
          (m) => !currentMusicIdList.includes(m.id),
        );
        if (!newMusicList.length) {
          toast.info('播放列表已包含这些音乐');
          return pl;
        }
        const newPlaylist = [
          ...pl,
          ...newMusicList.map((m) => ({ index: 0, music: m })),
        ];
        const { length } = newPlaylist;
        toast.success(`已添加${newMusicList.length}首音乐到播放列表`);
        return newPlaylist.map((m, index) => ({
          music: m.music,
          index: length - index,
        }));
      });

    // 插入播放队列
    const onInsertMusicToPlayqueueListener = onPlayMusicListener;

    // 清空播放列表
    const onClearPlaylistListener = () => setPlaylist([]);

    // 移除播放列表中的音乐
    const onRemovePlaylistMusicListener = (listMusic: MusicWithIndex) => {
      const { id } = listMusic.music;
      return setPlaylist((pl) => {
        const newPlaylist = pl.filter((m) => m.music.id !== id);
        const { length } = newPlaylist;
        return newPlaylist.map((m, index) => ({
          ...m,
          index: length - index,
        }));
      });
    };

    eventemitter.on(EventType.ACTION_PLAY_MUSIC, onPlayMusicListener);
    eventemitter.on(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      onAddMusicListToPlaylistListener,
    );
    eventemitter.on(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      onInsertMusicToPlayqueueListener,
    );
    eventemitter.on(EventType.ACTION_CLEAR_PLAYLIST, onClearPlaylistListener);
    eventemitter.on(
      EventType.ACTION_REMOVE_PLAYLIST_MUSIC,
      onRemovePlaylistMusicListener,
    );
    return () => {
      eventemitter.off(EventType.ACTION_PLAY_MUSIC, onPlayMusicListener);
      eventemitter.off(
        EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
        onAddMusicListToPlaylistListener,
      );
      eventemitter.off(
        EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
        onInsertMusicToPlayqueueListener,
      );
      eventemitter.off(
        EventType.ACTION_CLEAR_PLAYLIST,
        onClearPlaylistListener,
      );
      eventemitter.off(
        EventType.ACTION_REMOVE_PLAYLIST_MUSIC,
        onRemovePlaylistMusicListener,
      );
    };
  }, []);

  return playlist;
};
