import Eventemitter from 'eventemitter3';

export enum EventType {
  MUSIC_CREATED_OR_UPDATED_OR_DELETED = 'music_created_or_updated_or_deleted',
  OPEN_EDIT_COVER_DIALOG = 'open_edit_cover_dialog',
  OPEN_EDIT_DIALOG = 'open_edit_dialog',
  OPEN_EDIT_SINGER_LIST_DIALOG = 'open_edit_singer_list_dialog',
  OPEN_EDIT_LRC_DIALOG = 'open_edit_lrc_dialog',
  OPEN_EDIT_RESOURCE_DIALOG = 'open_edit_resource_dialog',
  OPEN_EDIT_FORK_FROM_DIALOG = 'open_edit_fork_from_dialog',
}

export default new Eventemitter<EventType>();
