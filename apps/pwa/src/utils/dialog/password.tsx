import { DialogBody, DialogFooter } from '@/components';
import Button from '@/components/button';
import Input from '@/components/input';
import { ChangeEventHandler, useState } from 'react';
import { t } from '@/i18n';
import {
  isPasswordLengthValid,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/constants/user';
import generateRandomString from '@/utils/generate_random_string';
import DialogBase from './dialog_base';
import {
  Alert,
  DEFAULT_CANCEL_VARIANT,
  DialogType,
  ID_LENGTH,
  Password as PasswordShape,
} from './constants';
import e, { EventType } from './eventemitter';
import useEvent from '../use_event';

function openErrorDialog(content: Alert['content']) {
  const id = generateRandomString(ID_LENGTH, false);
  const alert: Alert = {
    id,
    type: DialogType.ALERT,
    content,
  };
  e.emit(EventType.OPEN, alert);
}

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
      openErrorDialog(t('passwords_do_not_match'));
      return;
    }

    if (!isPasswordLengthValid(password)) {
      openErrorDialog(
        t(
          'password_length_warning',
          PASSWORD_MIN_LENGTH.toString(),
          PASSWORD_MAX_LENGTH.toString(),
        ),
      );
      return;
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
    <>
      <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input
          label={t('new_password')}
          value={password}
          onChange={onPasswordChange}
          type="password"
          autoFocus
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <Input
          label={t('confirm_new_password')}
          value={repeatedPassword}
          onChange={onRepeatedPasswordChange}
          type="password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />
      </DialogBody>
      <DialogFooter>
        <Button
          variant={options.cancelVariant ?? DEFAULT_CANCEL_VARIANT}
          onClick={onCancel}
          loading={canceling}
          disabled={confirming}
        >
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
      </DialogFooter>
    </>
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
