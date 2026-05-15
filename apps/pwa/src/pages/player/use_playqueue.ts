import { useState, useEffect, useRef, useCallback } from 'react';
import notice from '@/utils/notice';
import getRandomInteger from '@/utils/generate_random_integer';
import getRandomString from '@/utils/generate_random_string';
import { t } from '@/i18n';
import eventemitter, { EventType } from './eventemitter';
import { MusicWithSingerAliases, QueueMusic } from './constants';

function getRandomPlaylistMusic(
  playlist: MusicWithSingerAliases[],
  currentMusic?: MusicWithSingerAliases,
) {
  const nextMusicCandidates =
    currentMusic && playlist.length > 1
      ? playlist.filter((music) => music.id !== currentMusic.id)
      : playlist;
  return nextMusicCandidates[
    getRandomInteger(0, nextMusicCandidates.length)
  ];
}

function createShuffleQueueMusic({
  music,
  index,
}: {
  music: MusicWithSingerAliases;
  index: number;
}): QueueMusic {
  return {
    ...music,
    index,
    pid: getRandomString(),
    shuffle: true,
  };
}

function appendRandomMusicFromPlaylist({
  playqueue,
  playlist,
  currentPosition,
}: {
  playqueue: QueueMusic[];
  playlist: MusicWithSingerAliases[];
  currentPosition: number;
}) {
  const music = getRandomPlaylistMusic(
    playlist,
    playqueue[currentPosition],
  );
  return [
    ...playqueue,
    createShuffleQueueMusic({
      music,
      index: playqueue.length + 1,
    }),
  ];
}

function moveArrayItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default (playlist: MusicWithSingerAliases[]) => {
  const [playqueue, setPlayqueue] = useState<QueueMusic[]>([]);
  const [currentPosition, setCurrentPosition] = useState(-1);
  const playlistRef = useRef(playlist);
  const playqueueRef = useRef(playqueue);
  const currentPositionRef = useRef(currentPosition);

  const setPlayqueueSync = useCallback((next: QueueMusic[]) => {
    playqueueRef.current = next;
    setPlayqueue(next);
  }, []);

  const setCurrentPositionSync = useCallback((next: number) => {
    currentPositionRef.current = next;
    setCurrentPosition(next);
  }, []);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    playqueueRef.current = playqueue;
  }, [playqueue]);

  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  useEffect(() => {
    const unlistenActionPrevious = eventemitter.listen(
      EventType.ACTION_PREVIOUS,
      () => {
        const current = currentPositionRef.current;
        if (current <= 0) {
          notice.error(t('head_of_playqueue_tips'));
          return;
        }
        setCurrentPositionSync(current - 1);
      },
    );
    const unlistenActionPlayPlayqueueIndex = eventemitter.listen(
      EventType.ACTION_PLAY_PLAYQUEUE_INDEX,
      ({ index }) => setCurrentPositionSync(index),
    );
    const unlistenActionRemovePlayqueueMusic = eventemitter.listen(
      EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC,
      ({ queueMusic }) => {
        if (queueMusic.index - 1 <= currentPositionRef.current) {
          return;
        }

        setPlayqueue((pq) =>
          pq
            .filter((m) => m.pid !== queueMusic.pid)
            .map((m, index) =>
              m.index > queueMusic.index
                ? {
                    ...m,
                    index: index + 1,
                  }
                : m,
            ),
        );
      },
    );
    const unlistenActionMovePlayqueueMusicLater = eventemitter.listen(
      EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_LATER,
      ({ queueMusic }) =>
        setPlayqueue((pq) => {
          const { index } = queueMusic;
          return [
            ...pq.slice(0, index - 1),
            pq[index],
            pq[index - 1],
            ...pq.slice(index + 1, pq.length),
          ].map((m, i) =>
            i + 1 >= queueMusic.index
              ? {
                  ...m,
                  index: i + 1,
                }
              : m,
          );
        }),
    );
    const unlistenActionAddMusicListToPlaylist = eventemitter.listen(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      ({ musicList }) =>
        setPlayqueue((pq) => {
          if (pq.length) {
            return pq;
          }
          const music = getRandomPlaylistMusic(musicList);
          window.setTimeout(() => setCurrentPositionSync(0), 0);
          const next = [
            createShuffleQueueMusic({
              music,
              index: 1,
            }),
          ];
          playqueueRef.current = next;
          return next;
        }),
    );
    const unlistenActionMovePlayqueueMusicEarly = eventemitter.listen(
      EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY,
      ({ queueMusic }) =>
        setPlayqueue((pq) => {
          const { index } = queueMusic;
          return [
            ...pq.slice(0, index - 2),
            pq[index - 1],
            pq[index - 2],
            ...pq.slice(index, pq.length),
          ].map((m, i) =>
            i + 1 >= queueMusic.index - 1
              ? {
                  ...m,
                  index: i + 1,
                }
              : m,
          );
        }),
    );
    return () => {
      unlistenActionPrevious();
      unlistenActionPlayPlayqueueIndex();
      unlistenActionRemovePlayqueueMusic();
      unlistenActionMovePlayqueueMusicLater();
      unlistenActionAddMusicListToPlaylist();
      unlistenActionMovePlayqueueMusicEarly();
    };
  }, [setCurrentPositionSync]);

  useEffect(() => {
    const unlistenActionReorderPlayqueueMusic = eventemitter.listen(
      EventType.ACTION_REORDER_PLAYQUEUE_MUSIC,
      ({ activePid, overPid }) =>
        setPlayqueue((pq) => {
          const oldIndex = pq.findIndex((m) => m.pid === activePid);
          const newIndex = pq.findIndex((m) => m.pid === overPid);
          if (
            oldIndex < 0 ||
            newIndex < 0 ||
            oldIndex <= currentPosition ||
            newIndex <= currentPosition
          ) {
            return pq;
          }

          return moveArrayItem(pq, oldIndex, newIndex).map((m, index) =>
            m.index === index + 1
              ? m
              : {
                  ...m,
                  index: index + 1,
                },
          );
        }),
    );

    return unlistenActionReorderPlayqueueMusic;
  }, [currentPosition]);

  useEffect(() => {
    const unlistenActionPlayMusic = eventemitter.listen(
      EventType.ACTION_PLAY_MUSIC,
      ({ music }) => {
        setPlayqueue((pq) => {
          const next = [
            ...pq.slice(0, currentPosition + 1),
            { ...music, pid: getRandomString(), shuffle: false },
            ...pq.slice(currentPosition + 1),
          ].map((m, index) => ({
            ...m,
            index: index + 1,
          }));
          playqueueRef.current = next;
          return next;
        });
        setCurrentPosition((i) => {
          const next = i + 1;
          currentPositionRef.current = next;
          return next;
        });
      },
    );
    return unlistenActionPlayMusic;
  }, [currentPosition]);

  useEffect(() => {
    const unlistenActionNext = eventemitter.listen(
      EventType.ACTION_NEXT,
      () => {
        const current = currentPositionRef.current;
        let latestPlayqueue = playqueueRef.current;
        if (current === latestPlayqueue.length - 1) {
          const latestPlaylist = playlistRef.current;
          if (!latestPlaylist.length) {
            return notice.error(t('empty_playlist'));
          }
          // 系统媒体键可能在加载态连续触发, 这里同步 ref 以避免下一次事件读到旧队列.
          latestPlayqueue = appendRandomMusicFromPlaylist({
            playqueue: latestPlayqueue,
            playlist: latestPlaylist,
            currentPosition: current,
          });
          playqueueRef.current = latestPlayqueue;
          setPlayqueueSync(latestPlayqueue);
        }
        setCurrentPositionSync(current + 1);
      },
    );
    return unlistenActionNext;
  }, [setCurrentPositionSync, setPlayqueueSync]);

  useEffect(() => {
    if (
      currentPosition < 0 ||
      currentPosition < playqueue.length - 1 ||
      !playlist.length
    ) {
      return;
    }

    setPlayqueue((pq) => {
      if (
        currentPosition < 0 ||
        currentPosition < pq.length - 1 ||
        !playlist.length
      ) {
        return pq;
      }

      return appendRandomMusicFromPlaylist({
        playqueue: pq,
        playlist,
        currentPosition,
      });
    });
  }, [currentPosition, playlist, playqueue.length]);

  useEffect(() => {
    const unlistenActionInsertMusicToPlayqueue = eventemitter.listen(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      ({ music }) => {
        if (!playqueue.length) {
          setPlayqueueSync([
            {
              ...music,
              index: 1,
              pid: getRandomString(),
              shuffle: false,
            },
          ]);
          return setCurrentPositionSync(0);
        }
        setPlayqueueSync([
          ...playqueue.slice(0, currentPosition + 1),
          {
            ...music,
            pid: getRandomString(),
            shuffle: false,
            index: currentPosition + 2,
          },
          ...playqueue.slice(currentPosition + 1).map((m) => ({
            ...m,
            index: m.index + 1,
          })),
        ]);
      },
    );
    return unlistenActionInsertMusicToPlayqueue;
  }, [currentPosition, playqueue, setCurrentPositionSync, setPlayqueueSync]);

  return {
    playqueue,
    currentPosition,
  };
};
