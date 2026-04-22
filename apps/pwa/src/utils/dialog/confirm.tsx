import { useState } from 'react';
import { t } from '@/i18n';
import { Confirm as ConfirmShape } from './constants';
import { DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components_next';
import Button from '@/components_next/button';
import useEvent from '../use_event';
import DialogBase from './dialog_base';

function ConfirmContent({
  options,
  onClose,
}: {
  options: ConfirmShape;
  onClose: () => void;
}) {
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
  const onConfirm = useEvent(() => {
    setConfirming(true);
    return Promise.resolve(options.onConfirm ? options.onConfirm() : undefined)
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  });
  return (
    <>
      {options.title && (
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>
      )}
      {options.content && <DialogBody>{options.content}</DialogBody>}
      <DialogFooter>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {options.cancelText || t('cancel')}
        </Button>
        <Button
          variant={'primary'}
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

function Confirm({
  options,
  onDestroy,
}: {
  options: ConfirmShape;
  onDestroy: (id: string) => void;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => <ConfirmContent onClose={onClose} options={options} />}
    </DialogBase>
  );
}

export default Confirm;
