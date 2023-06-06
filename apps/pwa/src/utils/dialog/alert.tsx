import { useState } from 'react';
import { Alert as AlertType } from './constants';
import { Container, Content, Title, Action } from '../../components/dialog';
import Button, { Variant } from '../../components/button';
import useEvent from '../use_event';
import DialogBase from './dialog_base';

function AlertContent({
  alert,
  onClose,
}: {
  alert: AlertType;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const onConfirm = useEvent(() => {
    setConfirming(true);
    return Promise.resolve(alert.onConfirm ? alert.onConfirm() : undefined)
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  });
  return (
    <Container>
      {alert.title ? <Title>{alert.title}</Title> : null}
      {alert.content ? <Content>{alert.content}</Content> : null}
      <Action>
        <Button
          variant={Variant.PRIMARY}
          onClick={onConfirm}
          loading={confirming}
        >
          {alert.confirmText || '确定'}
        </Button>
      </Action>
    </Container>
  );
}

function Alert({
  alert,
  onDestroy,
}: {
  alert: AlertType;
  onDestroy: (id: string) => void;
}) {
  return (
    <DialogBase dialog={alert} onDestroy={onDestroy}>
      {({ onClose }) => <AlertContent alert={alert} onClose={onClose} />}
    </DialogBase>
  );
}

export default Alert;
