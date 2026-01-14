export const IS_TOUCHABLE =
  'ontouchstart' in window || window.navigator.maxTouchPoints > 0;

export const IS_MAC_OS =
  window.navigator.userAgent.toLowerCase().includes('mac os') && !IS_TOUCHABLE;

export const ENABLE_FILE_SYSTEM = 'showDirectoryPicker' in window;
