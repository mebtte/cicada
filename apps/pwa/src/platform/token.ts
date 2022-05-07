import storage, { Key } from '@/platform/storage';

/**
 * 检查是否有效的Date
 * @author mebtte<hi@mebtte.com>
 */
function isValidDate(date: any) {
  if (!(date instanceof Date)) {
    return false;
  }
  if (!date.getFullYear()) {
    return false;
  }
  return true;
}

export const clearToken = () => {
  storage.removeItem(Key.TOKEN_EXPIRED_AT);
  storage.removeItem(Key.TOKEN);
  storage.removeItem(Key.USER);
};

export const getToken = () => {
  const tokenExpireAtString = storage.getItem(Key.TOKEN_EXPIRED_AT);
  if (!tokenExpireAtString) {
    return '';
  }
  const tokenExpireAt = new Date(tokenExpireAtString);
  if (!isValidDate(tokenExpireAt) || tokenExpireAt.getTime() < Date.now()) {
    return '';
  }
  return storage.getItem(Key.TOKEN) || '';
};

export const setToken = (token: string, tokenExpireAt: string) => {
  storage.setItem({ key: Key.TOKEN, value: token });
  storage.setItem({
    key: Key.TOKEN_EXPIRED_AT,
    value: tokenExpireAt.toString(),
  });
};
