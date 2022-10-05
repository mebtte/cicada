import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { EMAIL } from '#/constants/regexp';
import styled from 'styled-components';
import notice from '#/utils/notice';
import Input from '#/components/input';
import logger from '#/utils/logger';
import storage, { Key } from '@/storage';
import Button, { Variant } from '#/components/button';
import { panelCSS } from '../constants';
import CaptchaDialog from './captcha_dialog';
import Logo from '../logo';
import Paper from '../paper';

const Style = styled(Paper)`
  ${panelCSS}

  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function EmailPanel({
  visible,
  updateEmail,
  toNext,
}: {
  visible: boolean;
  updateEmail: (email: string) => void;
  toNext: () => void;
}) {
  const emailRef = useRef<{ root: HTMLDivElement; input: HTMLInputElement }>(
    null,
  );

  const [email, setEmail] = useState('');
  const onEmailChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setEmail(event.target.value);

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

  useLayoutEffect(() => {
    if (visible) {
      emailRef.current?.input.focus();
    }
  }, [visible]);

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
      <Style visible={visible ? 1 : 0}>
        <Logo />
        <Input
          ref={emailRef}
          label="邮箱"
          inputProps={{
            type: 'email',
            value: email,
            onChange: onEmailChange,
            onKeyDown,
          }}
        />
        <Button
          variant={Variant.PRIMARY}
          onClick={openCaptchaDialog}
          disabled={!email.length}
        >
          继续
        </Button>
        <Button>设置</Button>
      </Style>
      {captchaDialogOpen ? (
        <CaptchaDialog
          email={email}
          updateEmail={updateEmail}
          toNext={toNextWrapper}
          onClose={closeCaptchaDialog}
        />
      ) : null}
    </>
  );
}

export default EmailPanel;
