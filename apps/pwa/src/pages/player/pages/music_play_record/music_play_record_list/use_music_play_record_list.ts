import logger from '@/utils/logger';
import { Query } from '@/constants';
import getMusicPlayRecordList from '@/server/get_music_play_record_list';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { PAGE_SIZE, MusicPlayRecord } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  value: {
    musicPlayRecordList: MusicPlayRecord[];
    total: number;
  } | null;
}
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default () => {
  const { keyword = '', page: pageString } = useQuery<
    Query.KEYWORD | Query.PAGE
  >();
  const page = pageString ? Number(pageString) || 1 : 1;

  const [data, setData] = useState<Data>(dataLoading);
  const getPageMusicPlayRecordList = useCallback(
    async ({ keyword: k, page: p }: { keyword: string; page: number }) => {
      setData(dataLoading);
      try {
        const d = await getMusicPlayRecordList({
          keyword: k,
          page: p,
          pageSize: PAGE_SIZE,
        });

        setData({
          error: null,
          loading: false,
          value: {
            total: d.total,
            musicPlayRecordList: d.musicPlayRecordList.map((mpr, i) => ({
              ...mpr,
              index: d.total - i,
            })),
          },
        });
      } catch (e) {
        logger.error(e, '获取我的音乐列表失败');
        setData({
          error: e,
          loading: false,
          value: null,
        });
      }
    },
    [],
  );
  const reload = useCallback(
    () => getPageMusicPlayRecordList({ keyword, page }),
    [getPageMusicPlayRecordList, keyword, page],
  );

  useEffect(() => {
    getPageMusicPlayRecordList({ keyword, page });
  }, [getPageMusicPlayRecordList, keyword, page]);

  useEffect(() => {
    const unlistenMusicDeleted = playerEventemitter.listen(
      PlayerEventType.MUSIC_DELETED,
      reload,
    );
    return unlistenMusicDeleted;
  }, [reload]);

  return {
    page,
    data,
    reload,
  };
};
