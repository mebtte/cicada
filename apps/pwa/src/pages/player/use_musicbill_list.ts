import { useState, useEffect, useCallback, useMemo } from 'react';
import getRandomCover from '@/utils/get_random_cover';
import { RequestStatus } from '@/constants';
import getSelfMusicbillList from '@/server/api/get_self_musicbill_list';
import addMusicToMusicbill from '@/server/api/add_music_to_musicbill';
import removeMusicFromMusicbill from '@/server/api/remove_music_from_musicbill';
import logger from '#/utils/logger';
import dialog from '@/utils/dialog';
import getSelfMusicbill from '@/server/api/get_self_musicbill';
import p from '@/global_states/profile';
import eventemitter, { EventType } from './eventemitter';
import { Musicbill } from './constants';

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

    const unlistenReloadMusicbillList = eventemitter.listen(
      EventType.RELOAD_MUSICBILL_LIST,
      getMusicbillList,
    );
    return unlistenReloadMusicbillList;
  }, [getMusicbillList]);

  useEffect(() => {
    const unlistenFetchMusicbill = eventemitter.listen(
      EventType.FETCH_MUSICBILL_DETAIL,
      async ({ id }) => {
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
                    ...m,
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
      },
    );
    const unlistenAddMusicToMusicbill = eventemitter.listen(
      EventType.ADD_MUSIC_TO_MUSICBILL,
      async ({ musicbill, music }) => {
        const { id: musicbillId } = musicbill;
        const { id: musicId } = music;
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === musicbillId) {
              const musicList = [{ ...music, index: 0 }, ...mb.musicList];
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
                const musicList = mb.musicList.filter((m) => m.id !== musicId);
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
      },
    );
    const unlistenRemoveMusicFromMusicbill = eventemitter.listen(
      EventType.REMOVE_MUSIC_FROM_MUSICBILL,
      async ({ musicbill, music }) => {
        const { id: musicbillId } = musicbill;
        const { id: musicId } = music;
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === musicbillId) {
              const musicList = mb.musicList.filter((m) => m.id !== musicId);
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
                const musicList = [{ ...music, index: 0 }, ...mb.musicList];
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
      },
    );
    const unlistenMusicUpdated = eventemitter.listen(
      EventType.MUSIC_UPDATED,
      ({ music }) =>
        setMusicbillList((mbl) =>
          mbl.map((mb) => ({
            ...mb,
            musicList: mb.musicList.map((m) =>
              m.id === music.id
                ? {
                    ...m,
                    ...music,
                  }
                : m,
            ),
          })),
        ),
    );
    return () => {
      unlistenFetchMusicbill();
      unlistenAddMusicToMusicbill();
      unlistenRemoveMusicFromMusicbill();
      unlistenMusicUpdated();
    };
  }, []);

  const profile = p.useState()!;
  const sortedMusicbillList = useMemo(() => {
    const orders = profile.musicbillOrders;
    return musicbillList.sort((a, b) => {
      const aOrder = orders.indexOf(a.id);
      const bOrder = orders.indexOf(b.id);
      return (
        (aOrder === -1 ? Infinity : aOrder) -
        (bOrder === -1 ? Infinity : bOrder)
      );
    });
  }, [musicbillList, profile.musicbillOrders]);

  return {
    status,
    musicbillList: sortedMusicbillList,
  };
};
