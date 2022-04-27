import { useCallback, useEffect, useState } from 'react';

import cmsGetSummaryData from '@/server/cms_get_summary_data';
import { RequestStatus } from '@/constants';
import { Data } from './constants';

export default () => {
  const [data, setData] = useState<
    | {
        status: RequestStatus.LOADING;
      }
    | {
        status: RequestStatus.ERROR;
        error: Error;
      }
    | {
        status: RequestStatus.SUCCESS;
        value: Data;
      }
  >({
    status: RequestStatus.LOADING,
  });

  const getSummaryData = useCallback(async () => {
    setData({ status: RequestStatus.LOADING });
    try {
      const d = await cmsGetSummaryData();
      setData({ status: RequestStatus.SUCCESS, value: d });
    } catch (error) {
      setData({ status: RequestStatus.ERROR, error });
    }
  }, []);

  useEffect(() => {
    getSummaryData();
  }, [getSummaryData]);

  return { data, retry: getSummaryData };
};
