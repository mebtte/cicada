import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Input from '@/components/input';
import { CSSProperties, ChangeEventHandler, useState } from 'react';
import DialogBase from './dialog_base';
import { TextInput as TextInputShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = { overflow: 'hidden' };

function TextInputContent({
  onClose,
  textInput,
}: {
  onClose: () => void;
  textInput: TextInputShape;
}) {
  const [text, setText] = useState(textInput.initialValue || '');
  const onTextChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setText(e.target.value);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(
      textInput.onCancel ? textInput.onCancel() : undefined,
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
      textInput.onConfirm ? textInput.onConfirm(text) : undefined,
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
      {textInput.title ? <Title>{textInput.title}</Title> : null}
      <Content style={contentStyle}>
        <Input
          label={textInput.label}
          disabled={confirming || canceling}
          inputProps={{
            value: text,
            onChange: onTextChange,
            autoFocus: true,
            maxLength: textInput.maxLength,
          }}
        />
      </Content>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {textInput.cancelText || '取消'}
        </Button>
        <Button
          variant={textInput.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {textInput.confirmText || '确定'}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  textInput,
}: {
  onDestroy: (id: string) => void;
  textInput: TextInputShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} dialog={textInput}>
      {({ onClose }) => (
        <TextInputContent onClose={onClose} textInput={textInput} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
