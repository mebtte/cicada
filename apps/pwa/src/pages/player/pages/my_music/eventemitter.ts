import Eventin from 'eventin';

export enum EventType {
  RELOAD_MUSIC_LIST = 'reload_music_list',
}

export default new Eventin<
  EventType,
  {
    [EventType.RELOAD_MUSIC_LIST]: null;
  }
>();
