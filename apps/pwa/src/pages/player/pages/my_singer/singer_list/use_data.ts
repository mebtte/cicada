import { Query } from '@/constants';
import getSelfSingerList from '@/server/get_self_singer_list';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import excludeProperty from '#/utils/exclude_property';
import day from '#/utils/day';
import { Singer } from '../constants';
import e, { EventType } from '../eventemitter';

type Status = {
  error: Error | null;
  loading: boolean;
};
const loadingStatus: Status = {
  error: null,
  loading: true,
};
const filterSinger = (singer: Singer, keyword: string) => {
  if (!keyword) {
    return true;
  }
  return (
    singer.name.toLowerCase().includes(keyword) ||
    !!singer.aliases.find((alias) => alias.toLowerCase().includes(keyword))
  );
};

export default () => {
  const { keyword = '' } = useQuery<Query.KEYWORD>();
  const [searching, setSearching] = useState(false);
  const [originalSingerList, setOriginalSingerList] = useState<Singer[]>([]);

  const [status, setStatus] = useState<Status>(loadingStatus);
  const getSingerList = useCallback(async () => {
    setStatus(loadingStatus);
    try {
      const singerList = await getSelfSingerList();
      setStatus({
        error: null,
        loading: false,
      });
      setOriginalSingerList(
        singerList.map((s, index) => ({
          ...excludeProperty(s, ['createTimestamp']),
          createTime: day(s.createTimestamp).format('YYYY-MM-DD'),

          index: singerList.length - index,
        })),
      );
    } catch (error) {
      setStatus({
        error,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    getSingerList();

    const unlistenReload = e.listen(
      EventType.RELOAD_SINGER_LIST,
      getSingerList,
    );
    return unlistenReload;
  }, [getSingerList]);

  useEffect(() => {
    setSearching(true);
    const timer = window.setTimeout(() => setSearching(false), 1000);
    return () => window.clearTimeout(timer);
  }, [keyword, originalSingerList]);

  return {
    status,
    reload: getSingerList,
    singerList: originalSingerList.filter((singer) =>
      filterSinger(singer, keyword.toLowerCase()),
    ),
    searching,
    keyword,
  };
};
