import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { openCreateSingerDialog as openCreateSingerDialogOriginal } from '../../utils';
import e, { EventType } from './eventemitter';

export const openCreateSingerDialog = () =>
  openCreateSingerDialogOriginal((id) => {
    playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, { id });
    e.emit(EventType.RELOAD_SINGER_LIST, null);
  });
