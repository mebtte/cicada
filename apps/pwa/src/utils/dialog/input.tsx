import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Label from '@/components/label';
import Input from '@/components/input';
import { CSSProperties, ChangeEventHandler, useState } from 'react';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { Input as InputShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = { overflow: 'hidden' };

function InputContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: InputShape;
}) {
  const [text, setText] = useState(options.initialValue || '');
  const onTextChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setText(e.target.value);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(options.onCancel ? options.onCancel() : undefined)
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = () => {
    setConfirming(true);
    return Promise.resolve(
      options.onConfirm ? options.onConfirm(text) : undefined,
    )
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  };

  return (
    <Container>
      {options.title ? <Title>{options.title}</Title> : null}
      <Content style={contentStyle}>
        <Label label={options.label}>
          <Input
            value={text}
            onChange={onTextChange}
            autoFocus
            maxLength={options.maxLength}
            type={options.inputType}
            disabled={confirming || canceling}
          />
        </Label>
      </Content>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {options.cancelText || t('cancel')}
        </Button>
        <Button
          variant={options.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {options.confirmText || t('confirm')}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  options,
}: {
  onDestroy: (id: string) => void;
  options: InputShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => <InputContent onClose={onClose} options={options} />}
    </DialogBase>
  );
}

export default Wrapper;
