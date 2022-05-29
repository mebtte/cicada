import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import styled from 'styled-components';
import { ChangeEventHandler, useLayoutEffect, useRef, useState } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import { panelCSS } from './constants';
import Logo from './logo';

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
        />
        <LoadingButton variant="contained">继续</LoadingButton>
        <Button variant="outlined" onClick={toPrevious}>
          上一步
        </Button>
      </Stack>
    </StyledPaper>
  );
}

export default LoginCodePanel;
