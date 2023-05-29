import logger from '@/utils/logger';
import getPublicMusicbill from '@/server/api/get_public_musicbill';
import DefaultCover from '@/asset/default_cover.jpeg';
import { useCallback, useEffect, useState } from 'react';
import { Musicbill } from './constants';
import e, { EventType } from './eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  musicbill: Musicbill | null;
}
const dataLoading: Data = {
  error: null,
  loading: true,
  musicbill: null,
};

export default (id: string) => {
  const [collected, setCollected] = useState(false);
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const musicbill = await getPublicMusicbill(id);
      setCollected(musicbill.collected);
      setData({
        error: null,
        loading: false,
        musicbill: {
          ...musicbill,
          cover: musicbill.cover || DefaultCover,
          user: {
            ...musicbill.user,
            avatar: musicbill.user.avatar || DefaultCover,
          },
          musicList: musicbill.musicList.map((m, index) => ({
            ...m,
            index: musicbill.musicList.length - index,
          })),
        },
      });
    } catch (error) {
      logger.error(error, '获取公开歌单失败');
      setData({
        error,
        loading: false,
        musicbill: null,
      });
    }
  }, [id]);

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    const unlistenCollectMusicbill = e.listen(
      EventType.COLLECT_MUSICBILL,
      (payload) => {
        if (data.musicbill && data.musicbill.id === payload.id) {
          setCollected(true);
        }
      },
    );
    const unlistenUncollectMusicbill = e.listen(
      EventType.UNCOLLECT_MUSICBILL,
      (payload) => {
        if (data.musicbill && data.musicbill.id === payload.id) {
          setCollected(false);
        }
      },
    );
    return () => {
      unlistenCollectMusicbill();
      unlistenUncollectMusicbill();
    };
  }, [data]);

  return { data, collected, reload: getData };
};
