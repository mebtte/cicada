import { useCallback, useEffect, useState } from 'react';

import logger from '@/platform/logger';
import cmsGetFigureList, { SearchKey } from '@/server/cms_get_figure_list';
import { PAGE_SIZE, Figure } from '../constants';
import eventemitter, { EventType } from '../eventemitter';

export default ({
  searchKey,
  searchValue,
  page,
}: {
  searchKey: SearchKey;
  searchValue: string;
  page: number;
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [figureList, setFigureList] = useState<Figure[]>([]);
  const [total, setTotal] = useState(0);
  const getFigureList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { total: latestTotal, list } = await cmsGetFigureList({
        page,
        pageSize: PAGE_SIZE,
        searchKey,
        searchValue,
      });
      setTotal(latestTotal);
      setFigureList(list);
    } catch (e) {
      logger.error(e, { description: '获取角色列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, [searchKey, searchValue, page]);

  useEffect(() => {
    getFigureList();

    eventemitter.on(
      EventType.FIGURE_CREATED_OR_UPDATED_OR_DELETED,
      getFigureList,
    );
    return () =>
      void eventemitter.off(
        EventType.FIGURE_CREATED_OR_UPDATED_OR_DELETED,
        getFigureList,
      );
  }, [getFigureList]);

  return { error, loading, page, total, figureList, retry: getFigureList };
};
