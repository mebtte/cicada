import styled from 'styled-components';
import { ChangeEventHandler, KeyboardEventHandler, useState } from 'react';
import notice from '@/utils/notice';
import loginRequest from '@/server/base/login';
import tk from '@/global_states/token';
import p from '@/global_states/profile';
import getProfile from '@/server/api/get_profile';
import sleep from '#/utils/sleep';
import storage, { Key } from '@/storage';
import logger from '@/utils/logger';
import Input from '@/components/input';
import Button, { Variant } from '@/components/button';
import DefaultCover from '@/asset/default_cover.jpeg';
import excludeProperty from '#/utils/exclude_property';
import { t } from '@/i18n';
import Paper from './paper';
import Logo from './logo';

const StyledPaper = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function LoginCodePanel({
  email,
  toPrevious,
}: {
  email: string;
  toPrevious: () => void;
}) {
  const [loginCode, setLoginCode] = useState('');
  const onLoginCodeChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setLoginCode(event.target.value);

  const [logining, setLogining] = useState(false);
  const login = async () => {
    if (!loginCode.length) {
      return notice.error(t('please_enter_login_code'));
    }

    setLogining(true);
    try {
      const token = await loginRequest({ email, loginCode });
      tk.set(token);

      await sleep(0);

      const profile = await getProfile();
      p.set(
        excludeProperty(
          {
            ...profile,
            avatar: profile.avatar || DefaultCover,
            admin: !!profile.admin,
            musicbillOrders: profile.musicbillOrdersJSON
              ? JSON.parse(profile.musicbillOrdersJSON)
              : [],
          },
          ['musicbillOrdersJSON'],
        ),
      );

      storage
        .setItem(Key.LAST_LOGIN_EMAIL, email)
        .catch((error) => logger.error(error, 'Failed to save login email'));
    } catch (error) {
      logger.error(error, 'Failed to login');
      notice.error(error.message);
    }
    setLogining(false);
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      login();
    }
  };

  return (
    <StyledPaper>
      <Logo />
      <Input label={t('email')} inputProps={{ value: email }} disabled />
      <Input
        label={t('login_code')}
        inputProps={{
          value: loginCode,
          onChange: onLoginCodeChange,
          onKeyDown,
          autoFocus: true,
        }}
        disabled={logining}
      />
      <Button
        variant={Variant.PRIMARY}
        disabled={!loginCode.length}
        loading={logining}
        onClick={login}
      >
        {t('continue')}
      </Button>
      <Button onClick={toPrevious} disabled={logining}>
        {t('previous_step')}
      </Button>
    </StyledPaper>
  );
}

export default LoginCodePanel;
