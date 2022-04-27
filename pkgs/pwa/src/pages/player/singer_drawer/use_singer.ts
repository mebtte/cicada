import { useState, useEffect, useCallback } from 'react';

import getRandomCover from '@/utils/get_random_cover';
import getSingerDetail from '@/server/get_singer_detail';
import logger from '@/platform/logger';
import { Data } from './constants';
import { transformMusic } from '../utils';

export default ({ id }: { id: string }) => {
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    singer: null,
  });

  const getSinger = useCallback(async () => {
    setData({
      error: null,
      loading: true,
      singer: null,
    });
    try {
      const detail = await getSingerDetail(id);
      setData({
        error: null,
        loading: false,
        singer: {
          id: detail.id,
          avatar: detail.avatar || getRandomCover(),
          name: detail.name,
          alias: detail.alias,
          musicList: detail.music_list.map((m, i) => ({
            index: detail.music_list.length - i,
            music: transformMusic(m),
          })),
        },
      });
    } catch (error) {
      logger.error(error, {
        description: '获取歌手音乐列表失败',
        report: true,
      });
      setData({
        error,
        loading: false,
        singer: null,
      });
    }
  }, [id]);

  useEffect(() => {
    getSinger();
  }, [getSinger]);

  return { data, reload: getSinger };
};
