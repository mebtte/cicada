import { useCallback, useEffect, useState } from 'react';

import cmsGetEmailNotificationList from '@/server/cms_get_email_notification_list';
import logger from '@/platform/logger';
import { EmailNotification, PAGE_SIZE } from './constants';

const INITIAL_TOTAL = 0;
const INITIAL_PAGE = 1;

export default ({ open, toUserId }: { open: boolean; toUserId: string }) => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(INITIAL_TOTAL);
  const [page, setPage] = useState(INITIAL_PAGE);
  const [emailNotificationList, setEmailNotificationList] = useState<
    EmailNotification[]
  >([]);
  const getEmailNotificationList = useCallback(async () => {
    if (!open) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await cmsGetEmailNotificationList({
        toUserId,
        page,
        pageSize: PAGE_SIZE,
      });
      setTotal(data.total);
      setEmailNotificationList(data.list);
    } catch (e) {
      logger.error(e, { description: '获取邮件通知列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, [open, page, toUserId]);

  useEffect(() => {
    setPage(INITIAL_PAGE);
    setTotal(INITIAL_TOTAL);
    setEmailNotificationList([]);
  }, [toUserId]);

  useEffect(() => {
    getEmailNotificationList();
  }, [getEmailNotificationList]);

  return {
    error,
    loading,
    total,
    page,
    onPageChange: setPage,
    emailNotificationList,
    retry: getEmailNotificationList,
  };
};
