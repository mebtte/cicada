import Eventin from 'eventin';

export enum EventType {
  OPEN_PROFILE_DIALOG = 'open_profile_dialog',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_PROFILE_DIALOG]: null;
  }
>();
