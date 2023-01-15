import Eventin from 'eventin';

export enum EventType {
  RELOAD_PROFILE = 'reload_profile',
  RELOAD_SERVER_METADATA = 'reload_server_metadata',
}

export default new Eventin<
  EventType,
  {
    [EventType.RELOAD_PROFILE]: null;
    [EventType.RELOAD_SERVER_METADATA]: null;
  }
>();
