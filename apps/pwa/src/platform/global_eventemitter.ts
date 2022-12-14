import Eventin from 'eventin';

export enum EventType {
  RELOAD_PROFILE = 'reload_profile',
}

export default new Eventin<
  EventType,
  {
    [EventType.RELOAD_PROFILE]: null;
  }
>();
