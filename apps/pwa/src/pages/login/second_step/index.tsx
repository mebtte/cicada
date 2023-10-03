import styled from 'styled-components';
import { ChangeEventHandler, useState } from 'react';
import Label from '@/components/label';
import Input from '@/components/input';
import Button, { Variant } from '@/components/button';
import { t } from '@/i18n';
import { PASSWORD_MAX_LENGTH, USERNAME_MAX_LENGTH } from '#/constants/user';
import logger from '@/utils/logger';
import login from '@/server/base/login';
import notice from '@/utils/notice';
import getProfile from '@/server/api/get_profile';
import server from '@/global_states/server';
import { useLocation } from 'react-router-dom';
import parseSearch from '@/utils/parse_search';
import { Query } from '@/constants';
import useNavigate from '@/utils/use_navigate';
import { ROOT_PATH } from '@/constants/route';
import { ExceptionCode } from '#/constants/exception';
import dialog from '@/utils/dialog';
import Logo from '../logo';
import UserList from './user_list';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  -webkit-app-region: no-drag;
`;
const addProfile = async (token: string) => {
  const profile = await getProfile(token);
  server.set((ss) => ({
    ...ss,
    serverList: ss.serverList.map((s) =>
      s.origin === ss.selectedServerOrigin
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
                  musicbillMaxAmount: profile.musicbillMaxAmount,
                  createMusicMaxAmountPerDay:
                    profile.createMusicMaxAmountPerDay,
                  musicPlayRecordIndate: profile.musicPlayRecordIndate,
                  twoFAEnabled: profile.twoFAEnabled,

                  token,
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

  const [loading, setLoading] = useState(false);

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
  const on2FALogin = () =>
    dialog.input({
      label: t('2fa_token'),
      confirmVariant: Variant.PRIMARY,
      onConfirm: async (twoFAToken) => {
        if (!twoFAToken) {
          notice.error(t('lack_of_2fa_token'));
          return false;
        }

        try {
          const token = await login({ username, password, twoFAToken });
          await addProfile(token);
          window.setTimeout(redirect, 0);
        } catch (error) {
          logger.error(error, 'Failed to login by 2FA');
          notice.error(error.message);
          return false;
        }
      },
    });

  const onLogin = async () => {
    setLoading(true);
    try {
      const token = await login({
        username,
        password,
      });
      await addProfile(token);
      window.setTimeout(redirect, 0);
    } catch (error) {
      logger.error(error, 'Failed to login');

      switch (error.code) {
        case ExceptionCode.LACK_OF_2FA_TOKEN: {
          on2FALogin();
          break;
        }
        default: {
          notice.error(error.message);
        }
      }
    }
    setLoading(false);
  };

  return (
    <Style>
      <Logo />
      <UserList disabled={loading} redirect={redirect} />
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
          maxLength={PASSWORD_MAX_LENGTH}
          disabled={loading}
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
      </Label>
      <Button
        variant={Variant.PRIMARY}
        loading={loading}
        disabled={!username.length || !password.length}
        onClick={onLogin}
      >
        {t('login')}
      </Button>
      <Button onClick={toPrevious} disabled={loading}>
        {t('previous_step')}
      </Button>
    </Style>
  );
}

export default SecondStep;
