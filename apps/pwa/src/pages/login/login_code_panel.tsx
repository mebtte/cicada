import Paper from '@mui/material/Paper';
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
import notice from '@/platform/notice';
import loginRequest from '@/apis/login';
import t from '@/global_state/token';
import u from '@/global_state/user';
import getProfile from '@/apis/get_profile';
import sleep from '#/utils/sleep';
import storage, { Key } from '@/platform/storage';
import Logo from './logo';
import { panelCSS } from './constants';

const StyledPaper = styled(Paper)`
  ${panelCSS}
`;

function LoginCodePanel({
  visible,
  email,
  toPrevious,
  toNext,
}: {
  visible: boolean;
  email: string;
  toPrevious: () => void;
  toNext: () => void;
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

      const user = await getProfile();
      u.set({
        ...user,
        super: !!user.super,
      });

      sleep(0).then(() => toNext());

      storage.setItem({ key: Key.LAST_SIGNIN_EMAIL, value: email });
    } catch (error) {
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
