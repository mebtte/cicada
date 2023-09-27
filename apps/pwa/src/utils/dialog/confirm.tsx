import { useState } from 'react';
import { t } from '@/i18n';
import { Confirm as ConfirmShape } from './constants';
import { Container, Content, Title, Action } from '../../components/dialog';
import Button, { Variant } from '../../components/button';
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
    <Container>
      {options.title ? <Title>{options.title}</Title> : null}
      {options.content ? <Content>{options.content}</Content> : null}
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {options.cancelText || t('cancel')}
        </Button>
        <Button
          variant={Variant.PRIMARY}
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
