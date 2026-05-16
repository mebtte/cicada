import Eventin from 'eventin';

export enum EventType {
  MUSIC_PLAY_RECORD_DELETED = 'music_play_record_deleted',
  MUSIC_PLAY_RECORD_DELETE_FAILED = 'music_play_record_delete_failed',
}

export default new Eventin<
  EventType,
  {
    [EventType.MUSIC_PLAY_RECORD_DELETED]: {
      recordId: number;
    };
    [EventType.MUSIC_PLAY_RECORD_DELETE_FAILED]: null;
  }
>();
