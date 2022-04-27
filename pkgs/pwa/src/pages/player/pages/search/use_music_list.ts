import { useCallback, useEffect, useState } from 'react';

import searchMusic from '@/server/search_music';
import searchMusicByLrc from '@/server/search_music_by_lrc';
import logger from '@/platform/logger';
import { MusicWithIndex } from '../../constants';
import { MusicWithIndexAndLrc, SearchType, PAGE_SIZE } from './constants';
import { transformMusic } from '../../utils';

export default ({
  page,
  searchType,
  searchValue,
}: {
  page: number;
  searchType: SearchType;
  searchValue: string;
}) => {
  const [error, setError] = useState<Error | null>();
  const [loading, setLoading] = useState(false);
  const [musicList, setMusicList] = useState<
    MusicWithIndex[] | MusicWithIndexAndLrc[]
  >([]);
  const [total, setTotal] = useState(0);
  const getMusicList = useCallback(async () => {
    if (!searchValue) {
      return setError(new Error('请输入关键字进行搜索'));
    }
    setError(null);
    setLoading(true);
    try {
      if (searchType === SearchType.COMPOSITE) {
        const data = await searchMusic({
          page,
          pageSize: PAGE_SIZE,
          keyword: searchValue,
        });
        setTotal(data.total);
        setMusicList(
          data.list.map((m, index) => ({
            index: data.list.length - index,
            music: transformMusic(m),
          })),
        );
      } else if (searchType === SearchType.LYRIC) {
        const data = await searchMusicByLrc({
          page,
          pageSize: PAGE_SIZE,
          keyword: searchValue,
        });
        setTotal(data.total);
        setMusicList(
          data.list.map((m, index) => ({
            index: data.list.length - index,
            music: {
              ...transformMusic(m),
              lrc: m.lrc,
            },
          })),
        );
      }
    } catch (e) {
      logger.error(e, { description: '搜索音乐失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, [searchType, searchValue, page]);

  useEffect(() => {
    getMusicList();
  }, [getMusicList]);

  return { error, loading, musicList, total, retry: getMusicList };
};
