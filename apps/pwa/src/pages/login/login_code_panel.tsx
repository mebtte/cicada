import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import styled from 'styled-components';
import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import notice from '@/utils/notice';
import loginRequest from '@/server/login';
import t from '@/global_states/token';
import p from '@/global_states/profile';
import getProfile from '@/server/get_profile';
import sleep from '#/utils/sleep';
import storage, { Key } from '@/storage';
import logger from '#/utils/logger';
import Paper from './paper';
import Logo from './logo';
import { panelCSS } from './constants';

const StyledPaper = styled(Paper)`
  ${panelCSS}
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
  const loginCodeRef = useRef<HTMLInputElement>(null);

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
        super: !!profile.super,
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
      loginCodeRef.current?.focus();
    } else {
      setLoginCode('');
    }
  }, [visible]);

  return (
    <StyledPaper visible={visible ? 1 : 0}>
      <Stack spacing={3}>
        <Logo />
        <TextField label="邮箱" value={email} disabled />
        <TextField
          label="登录验证码"
          value={loginCode}
          onChange={onLoginCodeChange}
          inputRef={loginCodeRef}
          onKeyDown={onKeyDown}
          disabled={logining}
        />
        <LoadingButton
          variant="contained"
          disabled={!loginCode.length}
          loading={logining}
          onClick={login}
        >
          继续
        </LoadingButton>
        <Button variant="outlined" onClick={toPrevious} disabled={logining}>
          上一步
        </Button>
      </Stack>
    </StyledPaper>
  );
}

export default LoginCodePanel;
