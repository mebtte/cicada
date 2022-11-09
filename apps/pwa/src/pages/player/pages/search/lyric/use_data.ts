import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import logger from '#/utils/logger';
import { Query } from '@/constants';
import searchMusicByLyric from '@/server/search_music_by_lyric';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { MusicWithLyric, PAGE_SIZE } from './constants';

type Data = {
  error: Error | null;
  loading: boolean;
  value: {
    keyword;
    total: number;
    musicList: MusicWithLyric[];
  } | null;
};
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default () => {
  const { keyword = '', page } = useQuery<Query.KEYWORD | Query.PAGE>();
  const pageNumber = (page ? Number(page) : 1) || 1;
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    if (!keyword) {
      return setData({
        error: new Error('请输入关键词进行搜索'),
        loading: false,
        value: null,
      });
    }

    setData(dataLoading);
    try {
      const d = await searchMusicByLyric({
        keyword: keyword
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, SEARCH_KEYWORD_MAX_LENGTH),
        page: pageNumber,
        pageSize: PAGE_SIZE,
      });
      setData({
        error: null,
        loading: false,
        value: {
          keyword,
          total: d.total,
          musicList: d.musicList.map((music, index) => ({
            ...music,
            index: d.total - index - (pageNumber - 1) * PAGE_SIZE,
          })),
        },
      });
    } catch (error) {
      logger.error(error, '通过歌词搜索音乐失败');
      setData({
        error,
        loading: false,
        value: null,
      });
    }
  }, [keyword, pageNumber]);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, reload: getData, page: pageNumber };
};
