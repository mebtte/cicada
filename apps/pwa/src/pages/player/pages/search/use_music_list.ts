import { useCallback, useEffect, useState } from 'react';
import searchMusic from '@/server_new/search_music';
import logger from '#/utils/logger';
import { MusicWithIndex } from '../../constants';
import { PAGE_SIZE } from './constants';

export default ({
  page,
  searchValue,
}: {
  page: number;
  searchValue: string;
}) => {
  const [error, setError] = useState<Error | null>();
  const [loading, setLoading] = useState(false);
  const [musicList, setMusicList] = useState<MusicWithIndex[]>([]);
  const [total, setTotal] = useState(0);
  const getMusicList = useCallback(async () => {
    if (!searchValue) {
      return setError(new Error('请输入关键字进行搜索'));
    }
    setError(null);
    setLoading(true);
    try {
      const data = await searchMusic({
        page,
        pageSize: PAGE_SIZE,
        keyword: searchValue,
      });
      setTotal(data.total);
      setMusicList(
        data.musicList.map((m, i) => ({
          index: data.musicList.length - i,
          music: m,
        })),
      );
    } catch (e) {
      logger.error(e, '搜索音乐失败');
      setError(e);
    }
    setLoading(false);
  }, [searchValue, page]);

  useEffect(() => {
    getMusicList();
  }, [getMusicList]);

  return { error, loading, musicList, total, retry: getMusicList };
};
