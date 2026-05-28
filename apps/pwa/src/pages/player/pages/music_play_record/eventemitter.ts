import Eventin from 'eventin';

export enum EventType {
  RELOAD = 'reload',
  LOADING_CHANGE = 'loading_change',
  MUSIC_PLAY_RECORD_DELETED = 'music_play_record_deleted',
  MUSIC_PLAY_RECORD_DELETE_FAILED = 'music_play_record_delete_failed',
}

export default new Eventin<
  EventType,
  {
    [EventType.RELOAD]: null;
    [EventType.LOADING_CHANGE]: {
      loading: boolean;
    };
    [EventType.MUSIC_PLAY_RECORD_DELETED]: {
      recordId: number;
    };
    [EventType.MUSIC_PLAY_RECORD_DELETE_FAILED]: null;
  }
>();
