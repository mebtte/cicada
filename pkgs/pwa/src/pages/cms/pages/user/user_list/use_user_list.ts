import { useCallback, useEffect, useState } from 'react';

import logger from '@/platform/logger';
import cmsGetUserList, { SearchKey } from '@/server/cms_get_user_list';
import { PAGE_SIZE, User } from '../constants';
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
  const [userList, setUserList] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const getUserList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { total: latestTotal, list } = await cmsGetUserList({
        page,
        pageSize: PAGE_SIZE,
        searchKey,
        searchValue,
      });
      setTotal(latestTotal);
      setUserList(list);
    } catch (e) {
      logger.error(e, { description: '获取角色列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, [searchKey, searchValue, page]);

  useEffect(() => {
    getUserList();

    eventemitter.on(EventType.USER_CREATED, getUserList);
    eventemitter.on(EventType.USER_UPDATED, getUserList);
    return () => {
      eventemitter.off(EventType.USER_CREATED, getUserList);
      eventemitter.off(EventType.USER_UPDATED, getUserList);
    };
  }, [getUserList]);

  return { error, loading, page, total, userList, retry: getUserList };
};
