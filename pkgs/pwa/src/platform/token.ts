import { USER, TOKEN, TOKEN_EXPIRED_AT } from '../constants/storage_key';

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
  localStorage.removeItem(TOKEN_EXPIRED_AT);
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
};

export const getToken = () => {
  const tokenExpireAtString = localStorage.getItem(TOKEN_EXPIRED_AT);
  if (!tokenExpireAtString) {
    return '';
  }
  const tokenExpireAt = new Date(tokenExpireAtString);
  if (!isValidDate(tokenExpireAt) || tokenExpireAt.getTime() < Date.now()) {
    return '';
  }
  return localStorage.getItem(TOKEN) || '';
};
