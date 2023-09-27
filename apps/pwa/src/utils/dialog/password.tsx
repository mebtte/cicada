import { Container, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Input from '@/components/input';
import Label from '@/components/label';
import { ChangeEventHandler, useState } from 'react';
import styled from 'styled-components';
import { t } from '@/i18n';
import { PASSWORD_MAX_LENGTH } from '#/constants/user';
import DialogBase from './dialog_base';
import { Password as PasswordShape } from './constants';
import useEvent from '../use_event';
import notice from '../notice';

const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;

  > .action {
    flex-shrink: 0;
  }
`;

function PasswordContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: PasswordShape;
}) {
  const [password, setPassword] = useState('');
  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setPassword(event.target.value);

  const [repeatedPassword, setRepeatedPassword] = useState('');
  const onRepeatedPasswordChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => setRepeatedPassword(event.target.value);

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
    if (password !== repeatedPassword) {
      return notice.error(t('passwords_do_not_match'));
    }

    setConfirming(true);
    return Promise.resolve(
      options.onConfirm ? options.onConfirm(password) : undefined,
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
      <StyledContent>
        <Label label={t('new_password')}>
          <Input
            value={password}
            onChange={onPasswordChange}
            type="password"
            autoFocus
            maxLength={PASSWORD_MAX_LENGTH}
          />
        </Label>
        <Label label={t('confirm_new_password')}>
          <Input
            value={repeatedPassword}
            onChange={onRepeatedPasswordChange}
            type="password"
            maxLength={PASSWORD_MAX_LENGTH}
          />
        </Label>
      </StyledContent>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {options.cancelText || t('cancel')}
        </Button>
        <Button
          variant={options.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling || !password.length || !repeatedPassword.length}
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
  options: PasswordShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => <PasswordContent onClose={onClose} options={options} />}
    </DialogBase>
  );
}

export default Wrapper;
