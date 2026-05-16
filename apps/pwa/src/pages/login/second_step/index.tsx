import styled from 'styled-components';
import { ChangeEventHandler, useState } from 'react';
import Input from '@/components/input';
import Button from '@/components/button';
import { t } from '@/i18n';
import {
  isPasswordLengthValid,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@/constants/user';
import logger from '@/utils/logger';
import login from '@/server/base/login';
import type { LoginResponse } from '@/server/base/login';
import loginWith2FA from '@/server/base/login_with_2fa';
import notice from '@/utils/notice';
import getProfile from '@/server/api/get_profile';
import { useLocation } from 'react-router-dom';
import parseSearch from '@/utils/parse_search';
import { Query } from '@/constants';
import useNavigate from '@/utils/use_navigate';
import { ROOT_PATH } from '@/constants/route';
import { ExceptionCode } from '@/constants/exception';
import dialog from '@/utils/dialog';
import { getCurrentDeviceName } from '@/utils/device_name';
import Logo from '../logo';
import UserList from './user_list';
import { getSelectedServer, useServer } from '@/global_states/server';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  -webkit-app-region: no-drag;
`;
const getDeviceInfo = () => ({
  deviceName: getCurrentDeviceName(),
});

const addProfile = async ({ token, sessionId }: LoginResponse) => {
  const profile = await getProfile(token);
  useServer.setState((server) => ({
    serverList: server.serverList.map((s) =>
      s.origin === server.selectedServerOrigin
        ? {
            ...s,
            selectedUserId: profile.id,
            users: s.users
              .filter((u) => u.id !== profile.id)
              .concat([
                {
                  id: profile.id,
                  username: profile.username,
                  avatar: profile.avatar,
                  nickname: profile.nickname,
                  joinTimestamp: profile.joinTimestamp,
                  admin: !!profile.admin,
                  musicbillOrders: profile.musicbillOrdersJSON
                    ? JSON.parse(profile.musicbillOrdersJSON)
                    : [],
                  twoFAEnabled: profile.twoFAEnabled,

                  token,
                  sessionId,
                },
              ]),
          }
        : s,
    ),
  }));
};

function SecondStep({ toPrevious }: { toPrevious: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedServer = useServer(getSelectedServer);
  const hasExistingUser = !!selectedServer?.users.length;

  const [username, setUserName] = useState('');
  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUserName(event.target.value.trim());

  const [password, setPassword] = useState('');
  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setPassword(event.target.value);

  const redirect = () => {
    const query = parseSearch<Query.REDIRECT>(location.search);
    return navigate({
      replace: true,
      path: query.redirect || ROOT_PATH.PLAYER,
    });
  };
  const passwordLengthWarning = () =>
    t(
      'password_length_warning',
      PASSWORD_MIN_LENGTH.toString(),
      PASSWORD_MAX_LENGTH.toString(),
    );
  const validatePasswordLength = () => {
    if (isPasswordLengthValid(password)) return true;

    notice.error(passwordLengthWarning());
    return false;
  };
  const onLoginWith2FA = () => {
    if (!validatePasswordLength()) return;

    return dialog.input({
      label: t('2fa_token'),
      inlineFooter: true,
      cancelVariant: 'ghost',
      confirmVariant: 'primary',
      onConfirm: async (twoFAToken) => {
        if (!twoFAToken) {
          notice.error(t('lack_of_2fa_token'));
          return false;
        }

        try {
          const loginResult = await loginWith2FA({
            username,
            password,
            twoFAToken,
            ...getDeviceInfo(),
          });
          await addProfile(loginResult);
          redirect();
        } catch (error) {
          logger.error(error, 'Failed to login with 2FA');
          dialog.alert({ content: error.message });
          return false;
        }
      },
    });
  };

  const onLogin = () => {
    if (!validatePasswordLength()) return;

    return dialog.captcha({
      inlineFooter: true,
      cancelVariant: 'ghost',
      confirmVariant: 'primary',
      onConfirm: async ({ captchaId, captchaValue }) => {
        try {
          const loginResult = await login({
            username,
            password,
            captchaId,
            captchaValue,
            ...getDeviceInfo(),
          });
          await addProfile(loginResult);
          redirect();
        } catch (error) {
          logger.error(error, 'Failed to login');

          switch (error.code) {
            case ExceptionCode.NEED_2FA: {
              onLoginWith2FA();
              break;
            }
            default: {
              dialog.alert({ content: error.message });
              return error.code === ExceptionCode.WRONG_USERNAME_OR_PASSWORD;
            }
          }
        }
      },
    });
  };

  return (
    <Style>
      <Logo />
      <UserList redirect={redirect} />
      <Input
        label={t('username')}
        value={username}
        onChange={onUsernameChange}
        maxLength={USERNAME_MAX_LENGTH}
        autoFocus={!hasExistingUser}
      />
      <Input
        label={t('password')}
        type="password"
        value={password}
        onChange={onPasswordChange}
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        onKeyDown={(event) => {
          if (
            event.key.toLowerCase() === 'enter' &&
            username.length !== 0 &&
            password.length !== 0
          ) {
            onLogin();
          }
        }}
      />
      <Button
        variant={'primary'}
        disabled={!username.length || !password.length}
        onClick={onLogin}
      >
        {t('login')}
      </Button>
      <Button variant={'ghost'} onClick={toPrevious}>
        {t('previous_step')}
      </Button>
    </Style>
  );
}

export default SecondStep;
