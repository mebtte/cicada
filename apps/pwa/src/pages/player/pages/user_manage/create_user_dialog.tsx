import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import { ChangeEventHandler, CSSProperties, useEffect, useState } from 'react';
import Button, { Variant } from '@/components/button';
import Input from '@/components/input';
import styled from 'styled-components';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import adminCreateUser from '@/server/api/admin_create_user';
import { t } from '@/i18n';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '#/constants/user';
import e, { EventType } from './eventemitter';
import { ZIndex } from '../../constants';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  const [username, setUsername] = useState('');
  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUsername(event.target.value.replace(/\s+/g, ''));

  const [remark, setRemark] = useState('');
  const onRemarkChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setRemark(event.target.value);

  const [loading, setLoading] = useState(false);
  const onCreate = async () => {
    if (
      username.length < USERNAME_MIN_LENGTH ||
      username.length > USERNAME_MAX_LENGTH
    ) {
      return notice.error(
        t(
          'valid_username_length',
          USERNAME_MIN_LENGTH.toString(),
          USERNAME_MAX_LENGTH.toString(),
        ),
      );
    }

    setLoading(true);
    try {
      await adminCreateUser({
        username,
        /**
         * @todo
         * @author mebtte<hi@mebtte.com>
         */
        password: '',
        remark: remark.replace(/\s+/g, ' ').trim(),
      });

      notice.info(t('user_created'));
      onClose();
      e.emit(EventType.RELOAD_DATA, null);
    } catch (error) {
      logger.error(error, 'Failed to create user');
      notice.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_CREATE_USER_DIALOG, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return (
    <Dialog open={open} maskProps={maskProps}>
      <Container>
        <Title>{t('create_user')}</Title>
        <StyledContent>
          <Input
            label={t('username')}
            inputProps={{
              value: username,
              onChange: onUsernameChange,
            }}
          />
          <Input
            label={t('remark')}
            inputProps={{
              value: remark,
              onChange: onRemarkChange,
            }}
          />
        </StyledContent>
        <Action>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant={Variant.PRIMARY}
            loading={loading}
            onClick={onCreate}
          >
            {t('create')}
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default CreateUserDialog;
