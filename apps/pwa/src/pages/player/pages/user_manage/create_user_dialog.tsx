import Dialog, { Container, Title, Content, Action } from '#/components/dialog';
import { ChangeEventHandler, CSSProperties, useEffect, useState } from 'react';
import Button, { Variant } from '#/components/button';
import Input from '#/components/input';
import styled from 'styled-components';
import notice from '#/utils/notice';
import { EMAIL } from '#/constants/regexp';
import logger from '#/utils/logger';
import adminCreateUser from '@/server/admin_create_user';
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
    if (!email) {
      return notice.error('请输入邮箱');
    }
    if (!EMAIL.test(email)) {
      return notice.error('邮箱格式错误');
    }

    setLoading(true);
    try {
      await adminCreateUser({
        email,
        remark: remark.replace(/\s+/g, ' ').trim(),
      });

      notice.success('已创建用户');
      onClose();
      e.emit(EventType.RELOAD_DATA, null);
    } catch (error) {
      logger.error(error, '创建用户失败');
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
        <Title>创建用户</Title>
        <StyledContent>
          <Input
            label="邮箱"
            inputProps={{
              value: email,
              onChange: onEmailChange,
              type: 'email',
            }}
          />
          <Input
            label="备注"
            inputProps={{
              value: remark,
              onChange: onRemarkChange,
              placeholder: '可选',
            }}
          />
        </StyledContent>
        <Action>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            variant={Variant.PRIMARY}
            loading={loading}
            onClick={onCreate}
          >
            创建
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default CreateUserDialog;
