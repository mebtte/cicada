import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Input from '@/components/input';
import { CSSProperties, useState } from 'react';
import IconButton from '@/components/icon_button';
import { ComponentSize } from '@/constants/style';
import { MdDelete } from 'react-icons/md';
import DialogBase from './dialog_base';
import { InputList as InputListShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = {
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

function InputListContent({
  onClose,
  inputList,
}: {
  onClose: () => void;
  inputList: InputListShape;
}) {
  const [values, setValues] = useState<{ id: number; content: string }[]>(
    () => {
      const from = (inputList.initialValue || []).map((t) => ({
        id: Math.random(),
        content: t,
      }));
      return from.length ? from : [{ id: Math.random(), content: '' }];
    },
  );
  const onValueChange = (content: string, id: number) =>
    setValues((ls) =>
      ls.map((l) =>
        l.id === id
          ? {
              ...l,
              content,
            }
          : l,
      ),
    );
  const onDelete = (id: number) =>
    setValues((vs) => vs.filter((v) => v.id !== id));

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(
      inputList.onCancel ? inputList.onCancel() : undefined,
    )
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = () => {
    setConfirming(true);
    return Promise.resolve(
      inputList.onConfirm
        ? inputList.onConfirm(values.map((v) => v.content))
        : undefined,
    )
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  };

  return (
    <Container>
      {inputList.title ? <Title>{inputList.title}</Title> : null}
      <Content style={contentStyle}>
        {values.map((value, index) => (
          <Input
            key={value.id}
            label={`${inputList.label} ${index + 1}`}
            addon={
              <IconButton
                size={ComponentSize.SMALL}
                onClick={() => onDelete(value.id)}
                disabled={confirming || canceling}
              >
                <MdDelete />
              </IconButton>
            }
            inputProps={{
              value: value.content,
              onChange: (event) => onValueChange(event.target.value, value.id),
              maxLength: inputList.maxLength,
            }}
            disabled={confirming || canceling}
          />
        ))}
        {values.length >= inputList.max! ? null : (
          <Button
            className="action"
            onClick={() =>
              setValues((vs) => [
                ...vs,
                {
                  id: Math.random(),
                  content: '',
                },
              ])
            }
            disabled={confirming || canceling}
          >
            新增{inputList.label}
          </Button>
        )}
      </Content>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {inputList.cancelText || '取消'}
        </Button>
        <Button
          variant={inputList.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {inputList.confirmText || '确定'}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  inputList,
}: {
  onDestroy: (id: string) => void;
  inputList: InputListShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} dialog={inputList}>
      {({ onClose }) => (
        <InputListContent onClose={onClose} inputList={inputList} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
