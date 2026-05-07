import { useState } from 'react';
import { t } from '@/i18n';
import { Confirm as ConfirmShape } from './constants';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components';
import Button from '@/components/button';
import useEvent from '../use_event';
import DialogBase from './dialog_base';
import styled from 'styled-components';

const ConfirmFooter = styled(DialogFooter)`
  gap: 12px;

  @media (min-width: 640px) {
    gap: 14px;

    > button {
      min-width: 96px;
    }
  }
`;

function isSimpleContent(content: ConfirmShape['content']) {
  return typeof content === 'string' || typeof content === 'number';
}

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
          {isSimpleContent(options.content) && (
            <DialogDescription>{options.content}</DialogDescription>
          )}
        </DialogHeader>
      )}
      {options.content && (!options.title || !isSimpleContent(options.content)) && (
        <DialogBody>{options.content}</DialogBody>
      )}
      <ConfirmFooter>
        <Button
          variant="ghost"
          onClick={onCancel}
          loading={canceling}
          disabled={confirming}
        >
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
      </ConfirmFooter>
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
