import Eventin from 'eventin';

export enum EventType {
  OPEN_CREATE_MUSIC_DIALOG = 'open_create_music_dialog',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_CREATE_MUSIC_DIALOG]: null;
  }
>();
