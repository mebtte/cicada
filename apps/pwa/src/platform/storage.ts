export enum Key {
  SERVER_ADDRESS = 'server_address',

  TOKEN = 'token',

  USER = 'user',

  LAST_SIGNIN_EMAIL = 'last_signin_email',
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
