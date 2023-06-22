import Eventin from 'eventin';

export enum EventType {
  OPEN_EDIT_MENU = 'open_edit_menu',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_EDIT_MENU]: null;
  }
>();
