import logger from '@/utils/logger';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import getPublicMusicbillCollectionList from '@/server/api/get_public_musicbill_collection_list';
import { PAGE_SIZE, Collection } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  value: {
    collectionList: Collection[];
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
  const getPageMusicList = useCallback(
    async ({ keyword: k, page: p }: { keyword: string; page: number }) => {
      setData(dataLoading);
      try {
        const d = await getPublicMusicbillCollectionList({
          keyword: k,
          page: p,
          pageSize: PAGE_SIZE,
        });

        setData({
          error: null,
          loading: false,
          value: {
            total: d.total,
            collectionList: d.collectionList.map((mb) => ({
              ...mb,
              cover: mb.cover,
            })),
          },
        });
      } catch (e) {
        logger.error(e, 'Fail to get public musicbill collection list');
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
    () => getPageMusicList({ keyword, page }),
    [getPageMusicList, keyword, page],
  );

  useEffect(() => {
    getPageMusicList({ keyword, page });
  }, [getPageMusicList, keyword, page]);

  useEffect(() => {
    const unlistenChange = playerEventemitter.listen(
      PlayerEventType.MUSICBILL_COLLECTION_CHANGE,
      reload,
    );
    return unlistenChange;
  }, [reload]);

  return {
    page,
    data,
    reload,
  };
};
