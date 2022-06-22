import p from '@/global_states/profile';
import getProfile from '@/server_new/get_profile';
import { useEffect } from 'react';

export default () => {
  const profile = p.useState();

  useEffect(() => {
    if (profile) {
      const updateProfile = () =>
        getProfile()
          .then((newProfile) =>
            p.set({
              ...newProfile,
              super: !!newProfile.super,
            }),
          )
          .catch((error) => console.error(error));
      updateProfile();

      const timer = window.setInterval(updateProfile, 1000 * 60 * 30);
      return window.clearInterval(timer);
    }
  }, [profile]);
};
