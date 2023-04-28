import p from '@/global_states/profile';
import getProfile from '@/server/api/get_profile';
import { useEffect } from 'react';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import getRandomCover from '@/utils/get_random_cover';
import excludeProperty from '#/utils/exclude_property';
import e, { EventType } from '../platform/global_eventemitter';

export default () => {
  const profile = p.useState();
  const hasProfile = !!profile;

  useEffect(() => {
    if (hasProfile) {
      const reloadProfile = () =>
        getProfile()
          .then((newProfile) =>
            p.set(
              excludeProperty(
                {
                  ...newProfile,
                  avatar: newProfile.avatar || getRandomCover(),
                  admin: !!newProfile.admin,
                  musicbillOrders: newProfile.musicbillOrdersJSON
                    ? JSON.parse(newProfile.musicbillOrdersJSON)
                    : [],
                },
                ['musicbillOrdersJSON'],
              ),
            ),
          )
          .catch((error) => {
            logger.error(error, '更新个人资料失败');
            notice.error('更新个人资料失败');
          });
      reloadProfile();

      const timer = window.setInterval(reloadProfile, 1000 * 60 * 30);
      const unlistenProfileUpdate = e.listen(
        EventType.RELOAD_PROFILE,
        reloadProfile,
      );
      return () => {
        window.clearInterval(timer);
        unlistenProfileUpdate();
      };
    }
  }, [hasProfile]);
};
