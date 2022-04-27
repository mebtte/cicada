import { useCallback, useEffect, useState } from 'react';

import logger from '@/platform/logger';
import getRecommendatoryMusicListRequest from '@/server/get_recommendatory_music_list';
import { Music } from '../../../constants';
import { transformMusic } from '../../../utils';

export default () => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [musicList, setMusicList] = useState<Music[]>([]);
  const getRecommendatoryMusicList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const ml = await getRecommendatoryMusicListRequest();
      setMusicList(ml.map(transformMusic));
    } catch (e) {
      logger.error(e, { description: '获取推荐音乐列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getRecommendatoryMusicList();
  }, [getRecommendatoryMusicList]);

  return { error, loading, musicList, reload: getRecommendatoryMusicList };
};
