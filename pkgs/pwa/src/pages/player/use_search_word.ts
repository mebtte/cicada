import { useState, useEffect } from 'react';

import { PublicConfigKey } from '@/constants/public_config';
import { REMOTE_CONFIG_SEARCH_WORD } from '@/constants/storage_key';
import getPublicConfig from '@/server/get_public_config';
import logger from '@/platform/logger';

const UPDATE_SEARCH_WORD_INTERVAL = 1000 * 60 * 15;

export default () => {
  const [searchWord, setSearchWord] = useState(
    localStorage.getItem(REMOTE_CONFIG_SEARCH_WORD) || '',
  );

  useEffect(() => {
    const request = () =>
      window.requestIdleCallback(() =>
        getPublicConfig(PublicConfigKey.SEARCH_WORD)
          .then((sw) => {
            localStorage.setItem(REMOTE_CONFIG_SEARCH_WORD, sw);
            return setSearchWord(sw);
          })
          .catch((error) =>
            logger.error(error, {
              description: '获取搜索词失败',
              report: true,
            }),
          ),
      );
    const timer = window.setInterval(request, UPDATE_SEARCH_WORD_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  return searchWord;
};
