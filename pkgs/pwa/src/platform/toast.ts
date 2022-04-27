import Eventemitter from 'eventemitter3';

const DEFAULT_DURATION = 8 * 1000;
const eventemitter = new Eventemitter();
const EVENT_TYPE = 'toast';

enum TOAST_TYPE {
  SUCCESS = 'success',
  INFO = 'info',
  ERROR = 'error',
}

export { eventemitter, EVENT_TYPE, TOAST_TYPE };

function success(message, { duration = DEFAULT_DURATION } = {}) {
  return eventemitter.emit(EVENT_TYPE, {
    type: TOAST_TYPE.SUCCESS,
    message,
    duration,
  });
}

function info(message, { duration = DEFAULT_DURATION } = {}) {
  return eventemitter.emit(EVENT_TYPE, {
    type: TOAST_TYPE.INFO,
    message,
    duration,
  });
}

function error(message, { duration = DEFAULT_DURATION } = {}) {
  return eventemitter.emit(EVENT_TYPE, {
    type: TOAST_TYPE.ERROR,
    message,
    duration,
  });
}

export default {
  success,
  info,
  error,
};
