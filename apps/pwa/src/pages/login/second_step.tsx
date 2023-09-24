import styled from 'styled-components';
import { ChangeEventHandler, useState } from 'react';
import Input from '@/components/input';
import Button, { Variant } from '@/components/button';
import { t } from '@/i18n';
import { USERNAME_MAX_LENGTH } from '#/constants/user';
import Paper from './paper';
import Logo from './logo';

const StyledPaper = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function SecondStep({ toPrevious }: { toPrevious: () => void }) {
  const [loading, setLoading] = useState(false);

  const [username, setUserName] = useState('');
  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUserName(event.target.value.trim());

  const [password, setPassword] = useState('');
  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUserName(event.target.value);

  const onLogin = () => {};

  return (
    <StyledPaper>
      <Logo />
      <Input
        label={t('username')}
        inputProps={{
          value: username,
          onChange: onUsernameChange,
          maxLength: USERNAME_MAX_LENGTH,
          autoFocus: true,
        }}
        disabled={loading}
      />
      <Input
        label={t('password')}
        inputProps={{
          value: password,
          onChange: onPasswordChange,
        }}
        disabled={loading}
      />
      <Button variant={Variant.PRIMARY} loading={loading} onClick={onLogin}>
        {t('login')}
      </Button>
      <Button onClick={toPrevious} disabled={loading}>
        {t('previous_step')}
      </Button>
    </StyledPaper>
  );
}

export default SecondStep;
