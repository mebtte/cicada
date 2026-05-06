import { useState, useEffect } from 'react';
import getMusic from '@/server/api/get_music';
import logger from '@/utils/logger';
import { PlaylistMusic } from '../constants';
import eventemitter, { EventType } from '../eventemitter';
import usePlaylistRestore from './use_playlist_restore';

export default () => {
  const [playlist, setPlaylist] = useState<PlaylistMusic[]>([]);
  usePlaylistRestore(playlist);

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
            return pl;
          }
          const newPlaylist = [
            ...pl,
            ...newMusicList.map((m) => ({ ...m, index: 0 })),
          ];
          const { length } = newPlaylist;
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
        getMusic({ id, requestMinimalDuration: 0 })
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
          .catch((error) => logger.error(error, 'Failed to get music')),
    );
    const unlistenMusicDeleted = eventemitter.listen(
      EventType.MUSIC_DELETED,
      (data) =>
        setPlaylist((pl) =>
          pl
            .filter((m) => m.id !== data.id)
            .map((music, index, { length }) => ({
              ...music,
              index: length - index,
            })),
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
    };
  }, []);

  useEffect(() => {
    const unlistenSingerUpdated = eventemitter.listen(
      EventType.SINGER_UPDATED,
      (payload) => {
        for (const music of playlist) {
          const exist = music.singers.find((s) => s.id === payload.id);
          if (exist) {
            getMusic({ id: music.id, requestMinimalDuration: 0 })
              .then((newMusic) =>
                setPlaylist((pl) =>
                  pl.map((m) =>
                    m.id === music.id
                      ? {
                          ...m,
                          ...newMusic,
                        }
                      : m,
                  ),
                ),
              )
              .catch((error) => logger.error(error, 'Failed to get music'));
          }
        }
      },
    );
    return unlistenSingerUpdated;
  }, [playlist]);

  return playlist;
};
