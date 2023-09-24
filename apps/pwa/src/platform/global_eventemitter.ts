import Eventin from 'eventin';

export enum EventType {
  FETCH_SERVER_METADATA_FAILED = 'fetch_server_metadata_failed',
  FETCH_SERVER_METADATA_SUCCEEDED = 'fetch_server_metadata_succeeded',
}

export default new Eventin<
  EventType,
  {
    [EventType.FETCH_SERVER_METADATA_FAILED]: { error: Error };
    [EventType.FETCH_SERVER_METADATA_SUCCEEDED]: null;
  }
>();
