import { useState, useEffect } from 'react';

import toast from '@/platform/toast';
import getRandomInteger from '@/utils/get_random_integer';
import getRandomString from '@/utils/get_random_string';
import eventemitter, { EventType } from './eventemitter';
import { Music, MusicWithIndex, QueueMusic } from './constants';

export default (playlist: MusicWithIndex[]) => {
  const [playqueue, setPlayqueue] = useState<QueueMusic[]>([]);
  const [currentPosition, setCurrentPosition] = useState(-1);

  useEffect(() => {
    // 上一首
    const onPreviousListener = () =>
      setCurrentPosition((i) => {
        if (i <= 0) {
          toast.error('已经是播放队列的第一首');
          return i;
        }
        return i - 1;
      });

    // 播放队列指定音乐
    const onPlayPlayqueueIndex = (index: number) => setCurrentPosition(index);

    // 从播放队列删除音乐
    const onRemovePlayqueueMusicListener = (queueMusic: QueueMusic) => {
      const { pid } = queueMusic;
      setPlayqueue((pq) =>
        pq
          .filter((m) => m.pid !== pid)
          .map((m, index) => ({
            ...m,
            index: index + 1,
          })),
      );
    };

    // 将播放队列的音乐推迟
    const onMovePlayqueueMusicLaterListener = (queueMusic: QueueMusic) =>
      setPlayqueue((pq) => {
        const { index } = queueMusic;
        return [
          ...pq.slice(0, index - 1),
          pq[index],
          pq[index - 1],
          ...pq.slice(index + 1, pq.length),
        ].map((m, i) => ({
          ...m,
          index: i + 1,
        }));
      });

    // 添加音乐列表到播放列表
    const onAddMusicListToPlaylistListener = ({
      musicList,
    }: {
      musicList: Music[];
    }) =>
      setPlayqueue((pq) => {
        if (pq.length) {
          return pq;
        }
        const music = musicList[getRandomInteger(0, musicList.length)];
        setTimeout(() => setCurrentPosition(0), 0);
        return [
          {
            music,
            index: 1,
            pid: getRandomString(),
          },
        ];
      });

    // 将播放队列的音乐提早
    const onMovePlayqueueMusicEarlyListener = (music: QueueMusic) =>
      setPlayqueue((pq) => {
        const { index } = music;
        return [
          ...pq.slice(0, index - 2),
          pq[index - 1],
          pq[index - 2],
          ...pq.slice(index, pq.length),
        ].map((m, i) => ({
          ...m,
          index: i + 1,
        }));
      });

    eventemitter.on(EventType.ACTION_PREVIOUS, onPreviousListener);
    eventemitter.on(
      EventType.ACTION_PLAY_PLAYQUEUE_INDEX,
      onPlayPlayqueueIndex,
    );
    eventemitter.on(
      EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC,
      onRemovePlayqueueMusicListener,
    );
    eventemitter.on(
      EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_LATER,
      onMovePlayqueueMusicLaterListener,
    );
    eventemitter.on(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      onAddMusicListToPlaylistListener,
    );
    eventemitter.on(
      EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY,
      onMovePlayqueueMusicEarlyListener,
    );
    return () => {
      eventemitter.off(EventType.ACTION_PREVIOUS, onPreviousListener);
      eventemitter.off(
        EventType.ACTION_PLAY_PLAYQUEUE_INDEX,
        onPlayPlayqueueIndex,
      );
      eventemitter.off(
        EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC,
        onRemovePlayqueueMusicListener,
      );
      eventemitter.off(
        EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_LATER,
        onMovePlayqueueMusicLaterListener,
      );
      eventemitter.off(
        EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
        onAddMusicListToPlaylistListener,
      );
      eventemitter.off(
        EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY,
        onMovePlayqueueMusicEarlyListener,
      );
    };
  }, []);

  useEffect(() => {
    // 指定播放音乐
    const onPlayMusicListener = (music: Music) => {
      setPlayqueue((pq) =>
        [
          ...pq.slice(0, currentPosition + 1),
          { music, pid: getRandomString() },
          ...pq.slice(currentPosition + 1),
        ].map((m, index) => ({
          ...m,
          index: index + 1,
        })),
      );
      setCurrentPosition((i) => i + 1);
    };
    eventemitter.on(EventType.ACTION_PLAY_MUSIC, onPlayMusicListener);
    return () => {
      eventemitter.off(EventType.ACTION_PLAY_MUSIC, onPlayMusicListener);
    };
  }, [currentPosition]);

  useEffect(() => {
    // 下一首
    const onNextListener = () => {
      if (currentPosition === playqueue.length - 1) {
        if (!playlist.length) {
          return toast.error('空的播放列表');
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
    };
    eventemitter.on(EventType.ACTION_NEXT, onNextListener);
    return () => {
      eventemitter.off(EventType.ACTION_NEXT, onNextListener);
    };
  }, [playlist, playqueue, currentPosition]);

  useEffect(() => {
    // 插入队列
    const onInsertMusicToPlayqueue = (music: Music) => {
      if (!playqueue.length) {
        setPlayqueue([
          {
            music,
            index: 1,
            pid: getRandomString(),
          },
        ]);
        setCurrentPosition(0);
        return;
      }
      toast.info(`下一首将播放"${music.name}"`);
      setPlayqueue(
        [
          ...playqueue.slice(0, currentPosition + 1),
          { music, pid: getRandomString() },
          ...playqueue.slice(currentPosition + 1),
        ].map((m, index) => ({
          ...m,
          index: index + 1,
        })),
      );
    };
    eventemitter.on(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      onInsertMusicToPlayqueue,
    );
    return () => {
      eventemitter.off(
        EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
        onInsertMusicToPlayqueue,
      );
    };
  }, [playqueue, currentPosition]);

  return {
    playqueue,
    currentPosition,
  };
};
