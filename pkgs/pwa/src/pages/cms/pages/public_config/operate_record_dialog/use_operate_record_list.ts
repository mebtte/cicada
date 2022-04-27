import { useCallback, useEffect, useState } from 'react';

import { PublicConfigKey } from '@/constants/public_config';
import cmsGetPublicConfigRecordList from '@/server/cms_get_public_config_record_list';
import logger from '@/platform/logger';
import { PAGE_SIZE, Record } from './constants';

const INITIAL_PAGE = 1;
const INITIAL_TOTAL = 0;

export default ({ open, key }: { open: boolean; key: PublicConfigKey }) => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(INITIAL_TOTAL);
  const [recordList, setRecordList] = useState<Record[]>([]);
  const [page, setPage] = useState(INITIAL_PAGE);
  const getRecordList = useCallback(async () => {
    if (!open) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await cmsGetPublicConfigRecordList({
        key,
        page,
        pageSize: PAGE_SIZE,
      });
      setTotal(data.total);
      setRecordList(data.list);
    } catch (e) {
      logger.error(e, {
        description: '获取公共配置操作记录列表失败',
        report: true,
      });
      setError(e);
    }
    setLoading(false);
  }, [open, key, page]);

  useEffect(() => {
    setPage(INITIAL_PAGE);
    setTotal(INITIAL_TOTAL);
    setRecordList([]);
  }, [key]);

  useEffect(() => {
    getRecordList();
  }, [getRecordList]);

  return {
    error,
    loading,
    page,
    onPageChange: setPage,
    total,
    recordList,
    retry: getRecordList,
  };
};
