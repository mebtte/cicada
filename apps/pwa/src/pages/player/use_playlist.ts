import { useState, useEffect } from 'react';
import notice from '#/utils/notice';
import { MusicWithIndex } from './constants';
import eventemitter, { EventType } from './eventemitter';

export default () => {
  const [playlist, setPlaylist] = useState<MusicWithIndex[]>([]);

  useEffect(() => {
    const unlistenActionPlayMusic = eventemitter.listen(
      EventType.ACTION_PLAY_MUSIC,
      ({ music }) =>
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
        }),
    );
    const unlistenActionAddMusicListToPlaylist = eventemitter.listen(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      ({ musicList }) =>
        setPlaylist((pl) => {
          const currentMusicIdList = pl.map((m) => m.music.id);
          const newMusicList = musicList.filter(
            (m) => !currentMusicIdList.includes(m.id),
          );
          if (!newMusicList.length) {
            notice.info('播放列表已包含这些音乐');
            return pl;
          }
          const newPlaylist = [
            ...pl,
            ...newMusicList.map((m) => ({ index: 0, music: m })),
          ];
          const { length } = newPlaylist;
          notice.success(`已添加${newMusicList.length}首音乐到播放列表`);
          return newPlaylist.map((m, index) => ({
            music: m.music,
            index: length - index,
          }));
        }),
    );
    const unlistenActionInsertMusicToPlayqueue = eventemitter.listen(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      ({ music }) =>
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
        }),
    );
    const unlistenActionClearPlaylist = eventemitter.listen(
      EventType.ACTION_CLEAR_PLAYLIST,
      () => setPlaylist([]),
    );
    const unlistenActionRemovePlaylistMusic = eventemitter.listen(
      EventType.ACTION_REMOVE_PLAYLIST_MUSIC,
      ({ listMusic }) => {
        const { id } = listMusic.music;
        return setPlaylist((pl) => {
          const newPlaylist = pl.filter((m) => m.music.id !== id);
          const { length } = newPlaylist;
          return newPlaylist.map((m, index) => ({
            ...m,
            index: length - index,
          }));
        });
      },
    );
    return () => {
      unlistenActionPlayMusic();
      unlistenActionAddMusicListToPlaylist();
      unlistenActionInsertMusicToPlayqueue();
      unlistenActionClearPlaylist();
      unlistenActionRemovePlaylistMusic();
    };
  }, []);

  return playlist;
};
