import Eventin from 'eventin';

export enum EventType {
  OPEN_CREATE_MUSIC_DIALOG = 'open_create_music_dialog',
  RELOAD_MUSIC_LIST = 'reload_music_list',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_CREATE_MUSIC_DIALOG]: null;
    [EventType.RELOAD_MUSIC_LIST]: null;
  }
>();
