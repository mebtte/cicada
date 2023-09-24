import styled from 'styled-components';
import { ChangeEventHandler, useState } from 'react';
import Label from '@/components/label';
import Input from '@/components/input';
import Button, { Variant } from '@/components/button';
import { t } from '@/i18n';
import { USERNAME_MAX_LENGTH } from '#/constants/user';
import Logo from './logo';

const StyledPaper = styled.div`
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
    setPassword(event.target.value);

  const onLogin = async () => {
    setLoading(true);
    setLoading(false);
  };

  return (
    <StyledPaper>
      <Logo />
      <Label label={t('username')}>
        <Input
          value={username}
          onChange={onUsernameChange}
          maxLength={USERNAME_MAX_LENGTH}
          autoFocus
          disabled={loading}
        />
      </Label>
      <Label label={t('password')}>
        <Input
          type="password"
          value={password}
          onChange={onPasswordChange}
          disabled={loading}
        />
      </Label>
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
