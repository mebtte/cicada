import Dialog, { Title, Content, Action } from '#/components/dialog';
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import Button from '#/components/button';
import notice from '#/utils/notice';
import { ZIndex } from '../constants';
import { EditDialogData, EditDialogType } from '../eventemitter';
import TextareaList from './textarea_list';
import { RenderProps } from './constants';
import Input from './input';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const TYPE_MAP_RENDER: Record<
  EditDialogType,
  (renderProps: RenderProps) => ReactNode
> = {
  [EditDialogType.IMAGE]: () => null,
  [EditDialogType.INPUT]: (renderProps) => <Input {...renderProps} />,
  [EditDialogType.TEXTAREA_LIST]: (renderProps) => (
    <TextareaList {...renderProps} />
  ),
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
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<unknown | undefined>(undefined);
  const onChange = useCallback((v: unknown) => setValue(v), []);

  const { title, type, onSubmit } = data;
  const onSubmitWrapper = async () => {
    setLoading(true);
    try {
      await onSubmit(value);
      onClose();
    } catch (error) {
      console.error(error);
      notice.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!open) {
      setValue(undefined);
    }
  }, [open]);

  return (
    <Dialog open={open} maskProps={maskProps}>
      <Title>{title}</Title>
      <Content>
        {TYPE_MAP_RENDER[type]({ data, loading, value, onChange })}
      </Content>
      <Action>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button onClick={onSubmitWrapper} loading={loading}>
          确认
        </Button>
      </Action>
    </Dialog>
  );
}

export default EditDialog;
