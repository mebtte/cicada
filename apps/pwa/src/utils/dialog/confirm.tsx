import { useState } from 'react';
import { t } from '@/i18n';
import { Confirm as ConfirmShape } from './constants';
import { Container, Content, Title, Action } from '../../components/dialog';
import Button, { Variant } from '../../components/button';
import useEvent from '../use_event';
import DialogBase from './dialog_base';

function ConfirmContent({
  confirm,
  onClose,
}: {
  confirm: ConfirmShape;
  onClose: () => void;
}) {
  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(confirm.onCancel ? confirm.onCancel() : undefined)
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = useEvent(() => {
    setConfirming(true);
    return Promise.resolve(confirm.onConfirm ? confirm.onConfirm() : undefined)
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  });
  return (
    <Container>
      {confirm.title ? <Title>{confirm.title}</Title> : null}
      {confirm.content ? <Content>{confirm.content}</Content> : null}
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {confirm.cancelText || t('cancel')}
        </Button>
        <Button
          variant={Variant.PRIMARY}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {confirm.confirmText || t('confirm')}
        </Button>
      </Action>
    </Container>
  );
}

function Confirm({
  confirm,
  onDestroy,
}: {
  confirm: ConfirmShape;
  onDestroy: (id: string) => void;
}) {
  return (
    <DialogBase onDestroy={onDestroy} dialog={confirm}>
      {({ onClose }) => <ConfirmContent onClose={onClose} confirm={confirm} />}
    </DialogBase>
  );
}

export default Confirm;
