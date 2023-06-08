import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import {
  ForwardRefExoticComponent,
  CSSProperties,
  useRef,
  useState,
} from 'react';
import Button from '@/components/button';
import notice from '@/utils/notice';
import { ZIndex } from '../constants';
import { EditDialogData, EditDialogType } from '../eventemitter';
import { Ref, RenderProps } from './constants';
import Input from './input';
import Cover from './cover';
import TextareaList from './textarea_list';
import InputList from './input_list';
import File from './file';
import MultipleSelect from './multiple_select';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const TYPE_MAP_RENDER: Record<
  EditDialogType,
  {
    Component: ForwardRefExoticComponent<RenderProps<EditDialogType>>;
    bodyStyle?: CSSProperties;
  }
> = {
  [EditDialogType.COVER]: { Component: Cover },
  [EditDialogType.INPUT]: { Component: Input },
  [EditDialogType.INPUT_LIST]: { Component: InputList },
  [EditDialogType.TEXTAREA_LIST]: {
    Component: TextareaList,
    bodyStyle: {
      width: 'min(550px, 80%)',
    },
  },
  [EditDialogType.FILE]: { Component: File },
  [EditDialogType.MULTIPLE_SELECT]: { Component: MultipleSelect },
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
  const ref = useRef<Ref>();

  const [loading, setLoading] = useState(false);

  const { title, type, onSubmit } = data;
  const onSubmitWrapper = async () => {
    setLoading(true);
    try {
      const value = await ref.current!.getValue();
      await onSubmit(value);
      onClose();
    } catch (error) {
      console.error(error);
      notice.error(error.message);
    }
    setLoading(false);
  };

  const { Component, bodyStyle } = TYPE_MAP_RENDER[type];
  return (
    <Dialog open={open} maskProps={maskProps} bodyProps={{ style: bodyStyle }}>
      <Container>
        <Title>{title}</Title>
        <Content>
          {/* @ts-expect-error */}
          <Component data={data} loading={loading} ref={ref} />
        </Content>
        <Action>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={onSubmitWrapper} loading={loading}>
            确认
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default EditDialog;
