import storage, { Key } from './storage';

// @ts-expect-error
window.devtool = {
  setCustomAppName(name: string) {
    return storage.setItem(Key.CUSTOM_APP_NAME, name);
  },
  resetCustomAppName() {
    return storage.removeItem(Key.CUSTOM_APP_NAME);
  },
};
