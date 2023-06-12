import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Input from '@/components/input';
import { CSSProperties, ChangeEventHandler, useState } from 'react';
import DialogBase from './dialog_base';
import { Input as InputShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = { overflow: 'hidden' };

function InputContent({
  onClose,
  input,
}: {
  onClose: () => void;
  input: InputShape;
}) {
  const [text, setText] = useState(input.initialValue || '');
  const onTextChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setText(e.target.value);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(input.onCancel ? input.onCancel() : undefined)
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
    return Promise.resolve(input.onConfirm ? input.onConfirm(text) : undefined)
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  };

  return (
    <Container>
      {input.title ? <Title>{input.title}</Title> : null}
      <Content style={contentStyle}>
        <Input
          label={input.label}
          disabled={confirming || canceling}
          inputProps={{
            value: text,
            onChange: onTextChange,
            autoFocus: true,
            maxLength: input.maxLength,
            type: input.inputType,
          }}
        />
      </Content>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {input.cancelText || '取消'}
        </Button>
        <Button
          variant={input.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {input.confirmText || '确定'}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  input,
}: {
  onDestroy: (id: string) => void;
  input: InputShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} dialog={input}>
      {({ onClose }) => <InputContent onClose={onClose} input={input} />}
    </DialogBase>
  );
}

export default Wrapper;
