import { useState, useEffect, useCallback, useMemo } from 'react';
import DefaultCover from '@/asset/default_cover.jpeg';
import { NORMAL_REQUEST_MINIMAL_DURATION, RequestStatus } from '@/constants';
import getMusicbillListRequest from '@/server/api/get_musicbill_list';
import addMusicToMusicbill from '@/server/api/add_music_to_musicbill';
import removeMusicFromMusicbill from '@/server/api/remove_music_from_musicbill';
import logger from '@/utils/logger';
import getMusicbillRequest from '@/server/api/get_musicbill';
import notice from '@/utils/notice';
import { ExceptionCode } from '#/constants/exception';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { useUser } from '@/global_states/server';
import eventemitter, { EventType } from './eventemitter';
import { Musicbill } from './constants';

export default () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState(RequestStatus.LOADING);
  const [musicbillList, setMusicbillList] = useState<Musicbill[]>([]);
  const getMusicbillList = useCallback(async (silence: boolean) => {
    if (!silence) {
      setStatus(RequestStatus.LOADING);
    }
    try {
      const mbl = await getMusicbillListRequest({
        requestMinimalDuration: silence ? 0 : NORMAL_REQUEST_MINIMAL_DURATION,
      });
      setMusicbillList(
        mbl.map((mb) => ({
          id: mb.id,
          name: mb.name,
          cover: mb.cover || DefaultCover,
          createTimestamp: mb.createTimestamp,
          public: !!mb.public,
          owner: mb.owner,
          sharedUserList: mb.sharedUserList,

          musicList: [],

          lastUpdateTimestamp: 0,
          status: RequestStatus.NOT_START,
          error: null,
        })),
      );
      setStatus(RequestStatus.SUCCESS);
    } catch (error) {
      logger.error(error, 'Fail to get musicbill list');
      notice.error(error.message);
      setStatus(RequestStatus.ERROR);
    }
  }, []);
  const getMusicbill = useCallback(
    async ({ id, silence }: { id: string; silence: boolean }) => {
      if (!silence) {
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === id) {
              return {
                ...mb,
                lastUpdateTimestamp: Date.now(),
                status: RequestStatus.LOADING,
                error: null,
              };
            }
            return mb;
          }),
        );
      }
      try {
        const data = await getMusicbillRequest(id);
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === id) {
              return {
                ...mb,
                name: data.name,
                cover: data.cover || mb.cover || DefaultCover,
                public: data.public,
                owner: data.owner,
                sharedUserList: data.sharedUserList,
                musicList: data.musicList.map((m, index) => ({
                  ...m,
                  index: data.musicList.length - index,
                })),

                lastUpdateTimestamp: Date.now(),
                status: RequestStatus.SUCCESS,
              };
            }
            return mb;
          }),
        );
      } catch (error) {
        logger.error(error, 'Fail to get musicbill');
        setMusicbillList((mbl) =>
          mbl.map((mb) => {
            if (mb.id === id) {
              return {
                ...mb,

                lastUpdateTimestamp: Date.now(),
                status: RequestStatus.ERROR,
                error,
              };
            }
            return mb;
          }),
        );
      }
    },
    [],
  );

  useEffect(() => {
    const unlistenReloadMusicbill = eventemitter.listen(
      EventType.RELOAD_MUSICBILL,
      (payload) => getMusicbill({ id: payload.id, silence: payload.silence }),
    );
    return unlistenReloadMusicbill;
  }, [getMusicbill]);

  useEffect(() => {
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
          if (error.code !== ExceptionCode.MUSIC_ALREADY_EXISTED_IN_MUSICBILL) {
            notice.error(error.message);
            setMusicbillList((mbl) =>
              mbl.map((mb) => {
                if (mb.id === musicbillId) {
                  const musicList = mb.musicList.filter(
                    (m) => m.id !== musicId,
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
          if (error.code !== ExceptionCode.MUSIC_NOT_EXISTED_IN_MUSICBILL) {
            notice.error(error.message);
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
        }
      },
    );
    return () => {
      unlistenAddMusicToMusicbill();
      unlistenRemoveMusicFromMusicbill();
    };
  }, []);

  const user = useUser()!;
  const sortedMusicbillList = useMemo(() => {
    const orders = user.musicbillOrders;
    return musicbillList.sort((a, b) => {
      const aOrder = orders.indexOf(a.id);
      const bOrder = orders.indexOf(b.id);
      return (
        (aOrder === -1 ? Infinity : aOrder) -
        (bOrder === -1 ? Infinity : bOrder)
      );
    });
  }, [musicbillList, user.musicbillOrders]);

  useEffect(() => {
    const reloadMusicbillList = () => getMusicbillList(false);
    const reloadMusicbillListSilently = () => getMusicbillList(true);

    reloadMusicbillList();

    const unlistenReloadMusicbillList = eventemitter.listen(
      EventType.RELOAD_MUSICBILL_LIST,
      (payload) =>
        payload.silence ? reloadMusicbillListSilently() : reloadMusicbillList(),
    );
    const unlistenMusicbillDeleted = eventemitter.listen(
      EventType.MUSICBILL_DELETED,
      reloadMusicbillList,
    );
    return () => {
      unlistenReloadMusicbillList();
      unlistenMusicbillDeleted();
    };
  }, [getMusicbillList]);

  useEffect(() => {
    const unlistenMusicbillCreated = eventemitter.listen(
      EventType.MUSICBILL_CREATED,
      (payload) =>
        getMusicbillList(true).then(() =>
          window.setTimeout(
            () =>
              navigate({
                path:
                  ROOT_PATH.PLAYER +
                  PLAYER_PATH.MUSICBILL.replace(':id', payload.id),
              }),
            0,
          ),
        ),
    );
    return unlistenMusicbillCreated;
  }, [getMusicbillList, navigate]);

  useEffect(() => {
    const onMusicChange = (id: string) => {
      for (const musicbill of musicbillList) {
        if (musicbill.status === RequestStatus.SUCCESS) {
          const exist = musicbill.musicList.find((m) => m.id === id);
          if (exist) {
            getMusicbill({ id: musicbill.id, silence: true });
          }
        }
      }
    };
    const unlistenMusicUpdated = eventemitter.listen(
      EventType.MUSIC_UPDATED,
      (payload) => onMusicChange(payload.id),
    );
    const unlistenMusicDeleted = eventemitter.listen(
      EventType.MUSIC_DELETED,
      (payload) => onMusicChange(payload.id),
    );
    const unlistenSingerUpdated = eventemitter.listen(
      EventType.SINGER_UPDATED,
      (payload) => {
        for (const musicbill of musicbillList) {
          if (musicbill.status === RequestStatus.SUCCESS) {
            for (const music of musicbill.musicList) {
              const exist = music.singers.find((s) => s.id === payload.id);
              if (exist) {
                getMusicbill({ id: musicbill.id, silence: true });
                break;
              }
            }
          }
        }
      },
    );
    return () => {
      unlistenMusicUpdated();
      unlistenMusicDeleted();
      unlistenSingerUpdated();
    };
  }, [getMusicbill, musicbillList]);

  return {
    status,
    musicbillList: sortedMusicbillList,
  };
};
