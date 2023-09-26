import * as server from '@/global_states/server';
import logger from '@/utils/logger';
import { useEffect } from 'react';

export default () => {
  useEffect(() => {
    const reloadUser = () =>
      server
        .reloadUser()
        .catch((error) => logger.error(error, 'Failed to reload user'));
    reloadUser();
    const timer = window.setInterval(reloadUser, 1000 * 60 * 30);
    return () => window.clearInterval(timer);
  }, []);
};
