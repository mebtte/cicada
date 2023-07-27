import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import { ChangeEventHandler, CSSProperties, useEffect, useState } from 'react';
import Button, { Variant } from '@/components/button';
import Input from '@/components/input';
import styled from 'styled-components';
import notice from '@/utils/notice';
import { EMAIL } from '#/constants/regexp';
import logger from '@/utils/logger';
import adminCreateUser from '@/server/api/admin_create_user';
import { t } from '@/i18n';
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

  const [email, setEmail] = useState('');
  const onEmailChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setEmail(event.target.value);

  const [remark, setRemark] = useState('');
  const onRemarkChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setRemark(event.target.value);

  const [loading, setLoading] = useState(false);
  const onCreate = async () => {
    if (!email || !EMAIL.test(email)) {
      return notice.error(t('please_enter_valid_email'));
    }

    setLoading(true);
    try {
      await adminCreateUser({
        email,
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
            label={t('email')}
            inputProps={{
              value: email,
              onChange: onEmailChange,
              type: 'email',
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
