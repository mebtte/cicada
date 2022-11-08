import { createMusicbill } from '../../utils';
import e, { EditDialogType, EventType } from '../../eventemitter';

export const openCreateMusicbillDialog = () =>
  e.emit(EventType.OPEN_EDIT_DIALOG, {
    type: EditDialogType.INPUT,
    title: '创建乐单',
    onSubmit: createMusicbill,
    label: '名字',
  });
