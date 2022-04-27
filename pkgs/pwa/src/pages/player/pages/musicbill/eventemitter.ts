import Eventemitter from 'eventemitter3';

export enum EventType {
  OPEN_EDIT_DIALOG = 'open_edit_dialog', // { }
  OPEN_COVER_EDIT_DIALOG = 'open_cover_edit_dialog', // { }
  TOP_CONTENT_CHANGE = 'top_content_change', // { topContent: TopContent }
  KEYWORD_CHANGE = 'keyword_change', // { keyword: string }
}

export default new Eventemitter<EventType>();
