import Eventemitter from 'eventemitter3';

export enum EventType {
  FIGURE_CREATED_OR_UPDATED_OR_DELETED = 'figure_created_or_updated_or_deleted',

  OPEN_EDIT_FIGURE_DIALOG = 'open_edit_figure_dialog',
  OPEN_EDIT_FIGURE_AVATAR_DIALOG = 'open_edit_figure_avatar_dialog',
}

export default new Eventemitter<EventType>();
