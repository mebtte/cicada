import styled from 'styled-components';
import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import notice from '#/utils/notice';
import loginRequest from '@/server/login';
import t from '@/global_states/token';
import p from '@/global_states/profile';
import getProfile from '@/server/get_profile';
import sleep from '#/utils/sleep';
import storage, { Key } from '@/storage';
import logger from '#/utils/logger';
import Input from '#/components/input';
import Button, { Variant } from '#/components/button';
import getRandomCover from '@/utils/get_random_cover';
import Paper from './paper';
import Logo from './logo';
import { panelCSS } from './constants';

const StyledPaper = styled(Paper)`
  ${panelCSS}

  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function LoginCodePanel({
  visible,
  email,
  toPrevious,
}: {
  visible: boolean;
  email: string;
  toPrevious: () => void;
}) {
  const inputRef = useRef<{ root: HTMLDivElement; input: HTMLInputElement }>(
    null,
  );

  const [loginCode, setLoginCode] = useState('');
  const onLoginCodeChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setLoginCode(event.target.value);

  const [logining, setLogining] = useState(false);
  const login = async () => {
    if (!loginCode.length) {
      return notice.error('请输入登录验证码');
    }

    setLogining(true);
    try {
      const token = await loginRequest({ email, loginCode });
      t.set(token);

      await sleep(0);

      const profile = await getProfile();
      p.set({
        ...profile,
        avatar: getRandomCover(),
        admin: !!profile.admin,
      });

      storage
        .setItem(Key.LAST_LOGIN_EMAIL, email)
        .catch((error) => logger.error(error, '保存登录邮箱失败'));
    } catch (error) {
      logger.error(error, '登录失败');
      notice.error(error.message);
    }
    setLogining(false);
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      login();
    }
  };

  useLayoutEffect(() => {
    if (visible) {
      inputRef.current?.input.focus();
    } else {
      setLoginCode('');
    }
  }, [visible]);

  return (
    <StyledPaper visible={visible ? 1 : 0}>
      <Logo />
      <Input label="邮箱" inputProps={{ value: email }} disabled />
      <Input
        label="登录验证码"
        inputProps={{
          value: loginCode,
          onChange: onLoginCodeChange,
          onKeyDown,
        }}
        ref={inputRef}
        disabled={logining}
      />
      <Button
        variant={Variant.PRIMARY}
        disabled={!loginCode.length}
        loading={logining}
        onClick={login}
      >
        继续
      </Button>
      <Button onClick={toPrevious} disabled={logining}>
        上一步
      </Button>
    </StyledPaper>
  );
}

export default LoginCodePanel;
