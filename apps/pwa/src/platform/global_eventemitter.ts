import Eventin from 'eventin';

export enum EventType {
  UPDATE_PROFILE = 'update_profile',
}

export default new Eventin<
  EventType,
  {
    [EventType.UPDATE_PROFILE]: null;
  }
>();
