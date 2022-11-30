export const IS_TOUCHABLE =
  'ontouchstart' in window || window.navigator.maxTouchPoints > 0;

export const IS_MAC_OS =
  window.navigator.userAgent.toLowerCase().includes('mac os') && !IS_TOUCHABLE;
export const IS_WINDOWS = window.navigator.userAgent
  .toLowerCase()
  .includes('windows');
export const IS_IPAD =
  window.navigator.userAgent.toLowerCase().includes('mac os') && IS_TOUCHABLE;
export const IS_IPHONE = window.navigator.userAgent
  .toLowerCase()
  .includes('iphone');
