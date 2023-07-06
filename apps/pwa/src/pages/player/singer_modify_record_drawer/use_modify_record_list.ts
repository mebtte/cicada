import { useCallback, useEffect, useState } from 'react';
import getSingerModifyRecordList from '@/server/api/get_singer_modify_record_list';
import { ModifyRecord } from './constants';

type Data =
  | { error: null; loading: true; value: null }
  | {
      error: Error;
      loading: false;
      value: null;
    }
  | {
      error: null;
      loading: false;
      value: ModifyRecord[];
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default ({ singerId }: { singerId: string }) => {
  const [data, setData] = useState<Data>(dataLoading);
  const getModifyRecordList = useCallback(async () => {
    setData(dataLoading);
    try {
      const modifyRecordList = await getSingerModifyRecordList({
        id: singerId,
      });
      setData({ error: null, loading: false, value: modifyRecordList });
    } catch (error) {
      setData({ error, loading: false, value: null });
    }
  }, [singerId]);

  useEffect(() => {
    getModifyRecordList();
  }, [getModifyRecordList]);

  return { data, reload: getModifyRecordList };
};
