import Eventin from 'eventin';
import { TopContent } from './constants';

export enum EventType {
  OPEN_EDIT_DIALOG = 'open_edit_dialog',
  OPEN_COVER_EDIT_DIALOG = 'open_cover_edit_dialog',
  TOP_CONTENT_CHANGE = 'top_content_change',
  KEYWORD_CHANGE = 'keyword_change',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_EDIT_DIALOG]: null;
    [EventType.OPEN_COVER_EDIT_DIALOG]: null;
    [EventType.TOP_CONTENT_CHANGE]: { topContent: TopContent };
    [EventType.KEYWORD_CHANGE]: { keyword: string };
  }
>();
