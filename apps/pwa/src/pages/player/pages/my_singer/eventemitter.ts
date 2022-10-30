import Eventin from 'eventin';

export enum EventType {
  RELOAD_SINGER_LIST = 'reload_singer_list',
}

export default new Eventin<
  EventType,
  {
    [EventType.RELOAD_SINGER_LIST]: null;
  }
>();
