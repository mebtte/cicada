import { DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components_next';
import Button from '@/components_next/button';
import Input from '@/components_next/input';
import { ChangeEventHandler, useState } from 'react';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { Input as InputShape } from './constants';
import useEvent from '../use_event';

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
    <>
      {options.title && (
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>
      )}
      <DialogBody>
        <Input
          label={options.label}
          value={text}
          onChange={onTextChange}
          autoFocus
          maxLength={options.maxLength}
          type={options.inputType}
          disabled={confirming || canceling}
          onKeyDown={(event) => {
            if (event.key.toLowerCase() === 'enter') {
              onConfirm();
            }
          }}
        />
      </DialogBody>
      <DialogFooter>
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
      </DialogFooter>
    </>
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
