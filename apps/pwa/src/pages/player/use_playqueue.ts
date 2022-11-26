import { useState, useEffect } from 'react';
import notice from '#/utils/notice';
import getRandomInteger from '#/utils/generate_random_integer';
import getRandomString from '#/utils/generate_random_string';
import eventemitter, { EventType } from './eventemitter';
import { MusicWithIndex, QueueMusic } from './constants';

export default (playlist: MusicWithIndex[]) => {
  const [playqueue, setPlayqueue] = useState<QueueMusic[]>([]);
  const [currentPosition, setCurrentPosition] = useState(-1);

  useEffect(() => {
    const unlistenActionPrevious = eventemitter.listen(
      EventType.ACTION_PREVIOUS,
      () =>
        setCurrentPosition((i) => {
          if (i <= 0) {
            notice.error('已经是播放队列的第一首');
            return i;
          }
          return i - 1;
        }),
    );
    const unlistenActionPlayPlayqueueIndex = eventemitter.listen(
      EventType.ACTION_PLAY_PLAYQUEUE_INDEX,
      ({ index }) => setCurrentPosition(index),
    );
    const unlistenActionRemovePlayqueueMusic = eventemitter.listen(
      EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC,
      ({ queueMusic }) =>
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
        ),
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
          const music = musicList[getRandomInteger(0, musicList.length)];
          window.setTimeout(() => setCurrentPosition(0), 0);
          return [
            {
              ...music,
              index: 1,
              pid: getRandomString(),
            },
          ];
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
  }, []);

  useEffect(() => {
    const unlistenActionPlayMusic = eventemitter.listen(
      EventType.ACTION_PLAY_MUSIC,
      ({ music }) => {
        setPlayqueue((pq) =>
          [
            ...pq.slice(0, currentPosition + 1),
            { ...music, pid: getRandomString() },
            ...pq.slice(currentPosition + 1),
          ].map((m, index) => ({
            ...m,
            index: index + 1,
          })),
        );
        setCurrentPosition((i) => i + 1);
      },
    );
    return unlistenActionPlayMusic;
  }, [currentPosition]);

  useEffect(() => {
    const unlistenActionNext = eventemitter.listen(
      EventType.ACTION_NEXT,
      () => {
        if (currentPosition === playqueue.length - 1) {
          if (!playlist.length) {
            return notice.error('空的播放列表');
          }
          const music = playlist[getRandomInteger(0, playlist.length)];
          setPlayqueue(
            [
              ...playqueue,
              {
                ...music,
                index: playqueue.length,
                pid: getRandomString(),
              },
            ].map((m, index) => ({
              ...m,
              index: index + 1,
            })),
          );
        }
        setCurrentPosition(currentPosition + 1);
      },
    );
    return unlistenActionNext;
  }, [playlist, playqueue, currentPosition]);

  useEffect(() => {
    const unlistenActionInsertMusicToPlayqueue = eventemitter.listen(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      ({ music }) => {
        if (!playqueue.length) {
          setPlayqueue([
            {
              ...music,
              index: 1,
              pid: getRandomString(),
            },
          ]);
          setCurrentPosition(0);
          return;
        }
        notice.info(`下一首将播放"${music.name}"`);
        setPlayqueue([
          ...playqueue.slice(0, currentPosition + 1),
          { ...music, pid: getRandomString(), index: currentPosition + 2 },
          ...playqueue.slice(currentPosition + 1).map((m) => ({
            ...m,
            index: m.index + 1,
          })),
        ]);
      },
    );
    return unlistenActionInsertMusicToPlayqueue;
  }, [playqueue, currentPosition]);

  useEffect(() => {
    const unlistenMusicUpdated = eventemitter.listen(
      EventType.MUSIC_UPDATED,
      ({ music }) =>
        setPlayqueue((pq) =>
          pq.map((m) =>
            m.id === music.id
              ? {
                  ...m,
                  music,
                }
              : m,
          ),
        ),
    );
    return unlistenMusicUpdated;
  }, []);

  return {
    playqueue,
    currentPosition,
  };
};
