import { useCallback, useEffect, useState } from 'react';

import getRandomCover from '@/utils/get_random_cover';
import logger from '@/platform/logger';
import getPublicMusicbillDetail from '@/server/get_public_musicbill_detail';
import { Data } from './constants';
import { transformMusic } from '../../utils';

export default (id: string) => {
  const [data, setData] = useState<Data>({
    loading: true,
    musicbill: null,
    error: null,
  });
  const getPublicMusicbill = useCallback(async () => {
    setData({
      loading: true,
      musicbill: null,
      error: null,
    });
    try {
      const pm = await getPublicMusicbillDetail(id);
      setData({
        loading: false,
        musicbill: {
          id,
          cover: pm.cover || getRandomCover(),
          name: pm.name,
          description: pm.description,
          user: {
            ...pm.user,
            avatar: pm.user.avatar || getRandomCover(),
          },
          musicList: pm.music_list.map((m, index) => ({
            index: pm.music_list.length - index,
            music: transformMusic(m),
          })),
        },
        error: null,
      });
    } catch (error) {
      logger.error(error, { description: '获取公共歌单失败', report: true });
      setData({
        loading: false,
        musicbill: null,
        error,
      });
    }
  }, [id]);

  useEffect(() => {
    getPublicMusicbill();
  }, [getPublicMusicbill]);

  return { data, reload: getPublicMusicbill };
};
