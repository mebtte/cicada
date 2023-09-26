import { reloadUser } from '@/global_states/server';
import logger from '@/utils/logger';
import { useEffect } from 'react';

export default () => {
  useEffect(() => {
    const timer = window.setInterval(
      () =>
        reloadUser().catch((error) =>
          logger.error(error, 'Failed to reload user'),
        ),
      1000 * 60 * 30,
    );
    return () => window.clearInterval(timer);
  }, []);
};
