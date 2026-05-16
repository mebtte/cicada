import { useState } from 'react';
import { t } from '@/i18n';
import { Alert as AlertType } from './constants';
import { DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components';
import Button from '@/components/button';
import useEvent from '../use_event';
import DialogBase from './dialog_base';

function AlertContent({
  options,
  onClose,
}: {
  options: AlertType;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const onConfirm = useEvent(() => {
    setConfirming(true);
    return Promise.resolve(options.onConfirm ? options.onConfirm() : undefined)
      .then((result) => {
        if (result === undefined || !!result) onClose();
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
        <Button variant="primary" onClick={onConfirm} loading={confirming}>
          {options.confirmText || t('alert_confirm')}
        </Button>
      </DialogFooter>
    </>
  );
}

function Alert({
  options,
  onDestroy,
}: {
  options: AlertType;
  onDestroy: (id: string) => void;
}) {
  return (
    <DialogBase options={options} onDestroy={onDestroy}>
      {({ onClose }) => <AlertContent options={options} onClose={onClose} />}
    </DialogBase>
  );
}

export default Alert;
