export enum Key {
  SETTING = 'setting',
  TOKEN = 'token',
  PROFILE = 'profile',
  LAST_SIGNIN_EMAIL = 'last_signin_email',

  PLAYER_VOLUME = 'player_volume',
}

export default {
  getItem(key: Key) {
    return window.localStorage.getItem(key);
  },
  setItem({ key, value }: { key: Key; value: string }) {
    return window.localStorage.setItem(key, value);
  },
  removeItem(key: Key) {
    return window.localStorage.removeItem(key);
  },
};
