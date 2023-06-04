import Eventin from 'eventin';

export enum EventType {
  OPEN_EDIT_MENU = 'open_edit_menu',
  OPEN_SHARE_DRAWER = 'open_share_drawer',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_EDIT_MENU]: null;
    [EventType.OPEN_SHARE_DRAWER]: null;
  }
>();
