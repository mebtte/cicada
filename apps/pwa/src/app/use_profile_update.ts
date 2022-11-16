import p from '@/global_states/profile';
import getProfile from '@/server/get_profile';
import { useEffect } from 'react';
import notice from '#/utils/notice';
import logger from '#/utils/logger';
import getRandomCover from '@/utils/get_random_cover';
import e, { EventType } from '../platform/global_eventemitter';

export default () => {
  const profile = p.useState();
  const hasProfile = !!profile;

  useEffect(() => {
    if (hasProfile) {
      const updateProfile = () =>
        getProfile()
          .then((newProfile) =>
            p.set({
              ...newProfile,
              avatar: newProfile.avatar || getRandomCover(),
              admin: !!newProfile.admin,
            }),
          )
          .catch((error) => {
            logger.error(error, '更新个人资料失败');
            notice.error('更新个人资料失败');
          });
      updateProfile();

      const timer = window.setInterval(updateProfile, 1000 * 60 * 30);
      const unlistenProfileUpdate = e.listen(
        EventType.UPDATE_PROFILE,
        updateProfile,
      );
      return () => {
        window.clearInterval(timer);
        unlistenProfileUpdate();
      };
    }
  }, [hasProfile]);
};
