import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import { EMAIL } from '#/constants/regexp';
import styled from 'styled-components';
import notice from '@/utils/notice';
import Input from '@/components/input';
import logger from '#/utils/logger';
import storage, { Key } from '@/storage';
import Button, { Variant } from '@/components/button';
import useEvent from '@/utils/use_event';
import CaptchaDialog from './captcha_dialog';
import Logo from '../logo';
import Paper from '../paper';
import SettingDialog from './setting_dialog';

const Style = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function EmailPanel({
  updateEmail,
  toNext,
}: {
  updateEmail: (email: string) => void;
  toNext: () => void;
}) {
  const [email, setEmail] = useState('');
  const onEmailChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setEmail(event.target.value);

  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const openSettingDialog = useEvent(() => setSettingDialogOpen(true));
  const closeSettingDialog = useEvent(() => setSettingDialogOpen(false));

  const [captchaDialogOpen, setCaptchaDialogOpen] = useState(false);
  const openCaptchaDialog = () => {
    if (!email.length) {
      return notice.error('请输入邮箱');
    }
    if (!EMAIL.test(email)) {
      return notice.error('邮箱格式错误');
    }
    return setCaptchaDialogOpen(true);
  };
  const closeCaptchaDialog = () => setCaptchaDialogOpen(false);

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      openCaptchaDialog();
    }
  };

  const toNextWrapper = () => {
    closeCaptchaDialog();
    return toNext();
  };

  useEffect(() => {
    storage
      .getItem(Key.LAST_LOGIN_EMAIL)
      .then((lastLoginEmail) => {
        if (lastLoginEmail) {
          setEmail(lastLoginEmail);
        }
      })
      .catch((error) => logger.error(error, '查找上次登录邮箱失败'));
  }, []);

  return (
    <>
      <Style>
        <Logo />
        <Input
          label="邮箱"
          inputProps={{
            type: 'email',
            value: email,
            onChange: onEmailChange,
            onKeyDown,
            autoFocus: true,
          }}
        />
        <Button
          variant={Variant.PRIMARY}
          onClick={openCaptchaDialog}
          disabled={!email.length}
        >
          继续
        </Button>
        <Button onClick={openSettingDialog}>设置</Button>
      </Style>
      <CaptchaDialog
        open={captchaDialogOpen}
        email={email}
        updateEmail={updateEmail}
        toNext={toNextWrapper}
        onClose={closeCaptchaDialog}
      />
      <SettingDialog open={settingDialogOpen} onClose={closeSettingDialog} />
    </>
  );
}

export default EmailPanel;
