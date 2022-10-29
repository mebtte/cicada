import Dialog, { Title, Content, Action } from '#/components/dialog';
import { CSSProperties, ReactNode } from 'react';
import Button from '#/components/button';
import { ZIndex } from '../constants';
import { EditDialogData, EditDialogType } from '../eventemitter';
import TextareaList from './textarea_list';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const TYPE_MAP_RENDER: Record<
  EditDialogType,
  (data: EditDialogData) => ReactNode
> = {
  [EditDialogType.IMAGE]: () => null,
  [EditDialogType.INPUT]: () => null,
  [EditDialogType.TEXTAREA_LIST]: (data) => <TextareaList data={data} />,
};

function EditDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: EditDialogData;
}) {
  const { title, type } = data;
  return (
    <Dialog open={open} maskProps={maskProps}>
      <Title>{title}</Title>
      <Content>{TYPE_MAP_RENDER[type](data)}</Content>
      <Action>
        <Button onClick={onClose}>取消</Button>
        <Button>确认</Button>
      </Action>
    </Dialog>
  );
}

export default EditDialog;
