import { useState, useEffect, useCallback } from 'react';
import getRandomCover from '@/utils/get_random_cover';
import { RequestStatus } from '@/constants';
import getSelfMusicbillList from '@/server_new/get_self_musicbill_list';
import addMusicToMusicbill from '@/server_new/add_music_to_musicbill';
import removeMusicFromMusicbill from '@/server_new/remove_music_from_musicbill';
import logger from '#/utils/logger';
import dialog from '@/platform/dialog';
import getSelfMusicbill from '@/server_new/get_self_musicbill';
import eventemitter, { EventType } from './eventemitter';
import { Music, Musicbill } from './constants';

export default () => {
  const [status, setStatus] = useState(RequestStatus.LOADING);
  const [musicbillList, setMusicbillList] = useState<Musicbill[]>([]);
  const getMusicbillList = useCallback(async () => {
    setStatus(RequestStatus.LOADING);
    try {
      const mbl = await getSelfMusicbillList();
      setMusicbillList(
        mbl.map((mb) => ({
          id: mb.id,
          name: mb.name,
          cover: mb.cover || getRandomCover(),
          createTimestamp: mb.createTimestamp,
          public: !!mb.public,

          musicList: [],

          status: RequestStatus.NOT_START,
          error: null,
        })),
      );
      setStatus(RequestStatus.SUCCESS);
    } catch (error) {
      logger.error(error, '获取乐单列表失败');
      dialog.alert({
        title: '获取乐单列表失败',
        content: error.message,
      });
      setStatus(RequestStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    getMusicbillList();

    eventemitter.on(EventType.RELOAD_MUSICBILL_LIST, getMusicbillList);
    return () =>
      void eventemitter.off(EventType.RELOAD_MUSICBILL_LIST, getMusicbillList);
  }, [getMusicbillList]);

  useEffect(() => {
    const getMusicbillDetail = async ({ id }: { id: string }) => {
      setMusicbillList((mbl) =>
        mbl.map((mb) => {
          if (mb.id === id) {
            return {
              ...mb,
              status: RequestStatus.LOADING,
              error: null,
            };
          }
          return mb;
        }),
      );
      try {
        const data = await getSelfMusicbill(id);
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === id) {
              return {
                ...mb,
                name: data.name,
                cover: data.cover || mb.cover || getRandomCover(),
                musicList: data.musicList.map((m, index) => ({
                  music: m,
                  index: data.musicList.length - index,
                })),
                public: !!data.public,

                status: RequestStatus.SUCCESS,
              };
            }
            return mb;
          }),
        );
      } catch (error) {
        logger.error(error, '获取自己的歌单详情失败');
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === id) {
              return {
                ...mb,
                status: RequestStatus.ERROR,
                error,
              };
            }
            return mb;
          }),
        );
      }
    };
    const addMusicToMusicbillListener = async ({
      musicbill,
      music,
    }: {
      musicbill: Musicbill;
      music: Music;
    }) => {
      const { id: musicbillId } = musicbill;
      const { id: musicId } = music;
      setMusicbillList((mbl) =>
        mbl.map((mb) => {
          if (mb.id === musicbillId) {
            const musicList = [{ index: 0, music }, ...mb.musicList];
            const { length } = musicList;
            return {
              ...mb,
              musicList: musicList.map((m, index) => ({
                music: m.music,
                index: length - index,
              })),
            };
          }
          return mb;
        }),
      );
      try {
        await addMusicToMusicbill(musicbillId, musicId);
      } catch (error) {
        logger.error(error, '添加音乐到乐单失败');
        dialog.alert({
          title: '添加音乐到乐单失败',
          content: error.message,
        });
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === musicbillId) {
              const musicList = mb.musicList.filter(
                (m) => m.music.id !== musicId,
              );
              const { length } = musicList;
              return {
                ...mb,
                musicList: musicList.map((m, index) => ({
                  ...m,
                  index: length - index,
                })),
              };
            }
            return mb;
          }),
        );
      }
    };
    const removeMusicFromMusicbillListener = async ({
      musicbill,
      music,
    }: {
      musicbill: Musicbill;
      music: Music;
    }) => {
      const { id: musicbillId } = musicbill;
      const { id: musicId } = music;
      setMusicbillList((mbl) =>
        mbl.map((mb) => {
          if (mb.id === musicbillId) {
            const musicList = mb.musicList.filter(
              (m) => m.music.id !== musicId,
            );
            const { length } = musicList;
            return {
              ...mb,
              musicList: musicList.map((m, index) => ({
                ...m,
                index: length - index,
              })),
            };
          }
          return mb;
        }),
      );
      try {
        await removeMusicFromMusicbill(musicbillId, musicId);
      } catch (error) {
        logger.error(error, '从乐单移除音乐失败');
        dialog.alert({
          title: '从乐单移除音乐失败',
          content: error.message,
        });
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === musicbillId) {
              const musicList = [{ index: 0, music }, ...mb.musicList];
              const { length } = musicList;
              return {
                ...mb,
                musicList: musicList.map((m, index) => ({
                  music: m.music,
                  index: length - index,
                })),
              };
            }
            return mb;
          }),
        );
      }
    };

    eventemitter.on(EventType.FETCH_MUSICBILL, getMusicbillDetail);
    eventemitter.on(
      EventType.ADD_MUSIC_TO_MUSICBILL,
      addMusicToMusicbillListener,
    );
    eventemitter.on(
      EventType.REMOVE_MUSIC_FROM_MUSICBILL,
      removeMusicFromMusicbillListener,
    );
    return () => {
      eventemitter.off(EventType.FETCH_MUSICBILL, getMusicbillDetail);
      eventemitter.off(
        EventType.ADD_MUSIC_TO_MUSICBILL,
        addMusicToMusicbillListener,
      );
      eventemitter.off(
        EventType.REMOVE_MUSIC_FROM_MUSICBILL,
        removeMusicFromMusicbillListener,
      );
    };
  }, []);

  return {
    status,
    musicbillList,
  };
};
