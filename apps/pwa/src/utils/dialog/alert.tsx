import { useState } from 'react';
import { t } from '@/i18n';
import { Alert as AlertType } from './constants';
import { Container, Content, Title, Action } from '../../components/dialog';
import Button, { Variant } from '../../components/button';
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
        <Button
          variant={Variant.PRIMARY}
          onClick={onConfirm}
          loading={confirming}
        >
          {options.confirmText || t('confirm')}
        </Button>
      </Action>
    </Container>
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
