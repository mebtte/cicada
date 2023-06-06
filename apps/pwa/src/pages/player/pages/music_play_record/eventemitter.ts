import Eventin from 'eventin';

export enum EventType {
  MUSIC_PLAY_RECORD_DELETED = 'music_play_record_deleted',
}

export default new Eventin<
  EventType,
  {
    [EventType.MUSIC_PLAY_RECORD_DELETED]: null;
  }
>();
