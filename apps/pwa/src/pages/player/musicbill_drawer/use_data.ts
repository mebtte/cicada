import logger from '#/utils/logger';
import getPublicMusicbill from '@/server/get_public_musicbill';
import getRandomCover from '@/utils/get_random_cover';
import { useCallback, useEffect, useState } from 'react';
import { Musicbill } from './constants';

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
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const musicbill = await getPublicMusicbill(id);
      setData({
        error: null,
        loading: false,
        musicbill: {
          ...musicbill,
          cover: musicbill.cover || getRandomCover(),
          user: {
            ...musicbill.user,
            avatar: musicbill.user.avatar || getRandomCover(),
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

  return { data, reload: getData };
};
