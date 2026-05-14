import { ChangeEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components';
import Button from '@/components/button';
import Input from '@/components/input';
import {
  isPasswordLengthValid,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@/constants/user';
import adminCreateUser from '@/server/api/admin_create_user';
import { t } from '@/i18n';
import logger from '@/utils/logger';
import notice from '@/utils/notice';

const Form = styled(DialogBody)`
  display: grid;
  gap: 18px;
`;

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) return;
    setUsername('');
    setPassword('');
    setRemark('');
    setLoading(false);
  }, [open]);

  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUsername(event.target.value.replace(/\s+/g, ''));
  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setPassword(event.target.value);
  const onRemarkChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setRemark(event.target.value);

  const onCreate = async () => {
    if (!isPasswordLengthValid(password)) {
      notice.error(
        t(
          'password_length_warning',
          PASSWORD_MIN_LENGTH.toString(),
          PASSWORD_MAX_LENGTH.toString(),
        ),
      );
      return;
    }

    setLoading(true);
    try {
      await adminCreateUser({
        username,
        password,
        remark: remark.replace(/\s+/g, ' ').trim(),
      });
      notice.info(t('user_created'));
      onCreated();
      onClose();
    } catch (error) {
      logger.error(error, 'Failed to create user');
      notice.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showClose={false} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('create_user')}</DialogTitle>
        </DialogHeader>
        <Form>
          <Input
            autoFocus
            label={t('username')}
            value={username}
            onChange={onUsernameChange}
            maxLength={USERNAME_MAX_LENGTH}
          />
          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={onPasswordChange}
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <Input label={t('remark')} value={remark} onChange={onRemarkChange} />
        </Form>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={loading}
            disabled={!username.length || !password.length}
            onClick={onCreate}
          >
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateUserDialog;
