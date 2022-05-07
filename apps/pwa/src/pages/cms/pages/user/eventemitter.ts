import Eventemitter from 'eventemitter3';

export enum EventType {
  USER_CREATED = 'user_created', // { }
  USER_UPDATED = 'user_updated', // { id: string }

  OPEN_UPDATE_DIALOG = 'open_update_dialog', // { user: User }

  TOGGLE_SELECT_USER = 'toggle_select_user', // { user: User }
  UNSELECT_USER = 'unselect_user', // { user: User }
}

export default new Eventemitter<EventType>();
