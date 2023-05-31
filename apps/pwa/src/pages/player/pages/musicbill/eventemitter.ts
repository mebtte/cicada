import Eventin from 'eventin';

export enum EventType {
  OPEN_EDIT_MENU = 'open_edit_menu',
  OPEN_SHARE_DRAWER = 'open_share_drawer',
  RELOAD_SHARED_USERS = 'reload_shared_users',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_EDIT_MENU]: null;
    [EventType.OPEN_SHARE_DRAWER]: null;
    [EventType.RELOAD_SHARED_USERS]: null;
  }
>();
