import { useState, useEffect } from 'react';
import notice from '@/utils/notice';
import getMusic from '@/server/api/get_music';
import logger from '@/utils/logger';
import { MusicWithSingerAliases, Index } from './constants';
import eventemitter, { EventType } from './eventemitter';

type PlaylistMusic = MusicWithSingerAliases & Index;

export default () => {
  const [playlist, setPlaylist] = useState<PlaylistMusic[]>([]);

  useEffect(() => {
    const unlistenActionPlayMusic = eventemitter.listen(
      EventType.ACTION_PLAY_MUSIC,
      ({ music }) =>
        setPlaylist((pl) => {
          const musicIdList = pl.map((m) => m.id);
          if (musicIdList.includes(music.id)) {
            return pl;
          }
          const newPlaylist: PlaylistMusic[] = [{ ...music, index: 0 }, ...pl];
          const { length } = newPlaylist;
          return newPlaylist.map((m, index) => ({
            ...m,
            index: length - index,
          }));
        }),
    );
    const unlistenActionAddMusicListToPlaylist = eventemitter.listen(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      ({ musicList }) =>
        setPlaylist((pl) => {
          const currentMusicIdList = pl.map((m) => m.id);
          const newMusicList = musicList.filter(
            (m) => !currentMusicIdList.includes(m.id),
          );
          if (!newMusicList.length) {
            notice.info('播放列表已包含这些音乐');
            return pl;
          }
          const newPlaylist = [
            ...pl,
            ...newMusicList.map((m) => ({ ...m, index: 0 })),
          ];
          const { length } = newPlaylist;
          notice.info(`已添加${newMusicList.length}首音乐到播放列表`);
          return newPlaylist.map((m, index) => ({
            ...m,
            index: length - index,
          }));
        }),
    );
    const unlistenActionInsertMusicToPlayqueue = eventemitter.listen(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      ({ music }) =>
        setPlaylist((pl) => {
          const musicIdList = pl.map((m) => m.id);
          if (musicIdList.includes(music.id)) {
            return pl;
          }
          const newPlaylist: PlaylistMusic[] = [{ ...music, index: 0 }, ...pl];
          const { length } = newPlaylist;
          return newPlaylist.map((m, index) => ({
            ...m,
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
      (payload) =>
        setPlaylist((pl) => {
          const newPlaylist = pl.filter((m) => m.id !== payload.id);
          const { length } = newPlaylist;
          return newPlaylist.map((m, index) => ({
            ...m,
            index: length - index,
          }));
        }),
    );
    const unlistenMusicUpdated = eventemitter.listen(
      EventType.MUSIC_UPDATED,
      ({ id }) =>
        getMusic(id)
          .then((music) =>
            setPlaylist((pl) =>
              pl.map((m) =>
                m.id === music.id
                  ? {
                      ...m,
                      ...music,
                    }
                  : m,
              ),
            ),
          )
          .catch((error) => logger.error(error, '获取音乐数据失败')),
    );
    const unlistenMusicDeleted = eventemitter.listen(
      EventType.MUSIC_DELETED,
      (data) => setPlaylist((pl) => pl.filter((m) => m.id !== data.id)),
    );
    const unlistenSingerUpdated = eventemitter.listen(
      EventType.SINGER_UPDATED,
      (data) =>
        setPlaylist((pl) =>
          pl.map((m) => {
            const singer = m.singers.find((s) => s.id === data.singer.id);
            if (singer) {
              return {
                ...m,
                singers: m.singers.map((s) => {
                  if (s.id === data.singer.id) {
                    return data.singer;
                  }
                  return s;
                }),
              };
            }
            return m;
          }),
        ),
    );
    return () => {
      unlistenActionPlayMusic();
      unlistenActionAddMusicListToPlaylist();
      unlistenActionInsertMusicToPlayqueue();
      unlistenActionClearPlaylist();
      unlistenActionRemovePlaylistMusic();
      unlistenMusicUpdated();
      unlistenMusicDeleted();
      unlistenSingerUpdated();
    };
  }, []);

  return playlist;
};
