import Eventin from 'eventin';

export enum EventType {
  INVITATION_ACCEPTED = 'invitation_accepted',
}

export default new Eventin<
  EventType,
  {
    [EventType.INVITATION_ACCEPTED]: { id: number };
  }
>();
