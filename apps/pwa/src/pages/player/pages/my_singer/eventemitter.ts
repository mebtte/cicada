import Eventin from 'eventin';

export enum EventType {
  OPEN_CREATE_SINGER_DIALOG = 'open_create_singer_dialog',
  RELOAD_SINGER_LIST = 'reload_singer_list',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_CREATE_SINGER_DIALOG]: null;
    [EventType.RELOAD_SINGER_LIST]: null;
  }
>();
