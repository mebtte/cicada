import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../../eventemitter';
import { createSinger } from '../../utils';
import e, { EventType } from './eventemitter';

export const openCreateSingerDialog = () =>
  playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
    title: '创建歌手',
    label: '名字',
    type: EditDialogType.INPUT,
    onSubmit: async (name: string) =>
      createSinger({
        name,
        callback: (id) => {
          playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, { id });
          e.emit(EventType.RELOAD_SINGER_LIST, null);
        },
      }),
  });
