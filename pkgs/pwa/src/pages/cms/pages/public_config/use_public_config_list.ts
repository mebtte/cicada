import { useCallback, useEffect, useState } from 'react';

import cmsGetPublicConfigList from '@/server/cms_get_public_config_list';
import { PublicConfig } from './constants';
import eventemitter, { EventType } from './eventemitter';

export default () => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [publicConfigList, setPublicConfigList] = useState<PublicConfig[]>([]);
  const getPublicConfigList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pcl = await cmsGetPublicConfigList();
      setPublicConfigList(pcl);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getPublicConfigList();

    eventemitter.on(EventType.PUBLIC_CONFIG_UPDATED, getPublicConfigList);
    return () =>
      void eventemitter.off(
        EventType.PUBLIC_CONFIG_UPDATED,
        getPublicConfigList,
      );
  }, [getPublicConfigList]);

  return { error, loading, publicConfigList, retry: getPublicConfigList };
};
