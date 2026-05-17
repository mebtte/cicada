import { KeyboardEvent, memo, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  MdDevicesOther,
  MdLogout,
  MdPassword,
  MdSecurity,
  MdSwitchAccount,
} from 'react-icons/md';
import Page, { PAGE_HORIZONTAL_PADDING } from '../page';
import autoScrollbar from '@/style/auto_scrollbar';
import { CSSVariable } from '@/global_style';
import getResizedImage from '@/server/asset/get_resized_image';
import {
  getSelectedServer,
  reloadUser,
  useServer,
  useUser,
} from '@/global_states/server';
import day from '@/utils/day';
import Button from '@/components/button';
import dialog from '@/utils/dialog';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType } from '@/constants/asset';
import updateProfile from '@/server/api/update_profile';
import { AllowUpdateKey, NICKNAME_MAX_LENGTH } from '@/constants/user';
import { ROOT_PATH } from '@/constants/route';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import { t } from '@/i18n';
import playerEventemitter, { EventType } from '../../eventemitter';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../constants';
import context from '../../context';
import { IconEdit } from '@/components/icon';
import Input from '@/components/input';
import Avatar from '@/components/avatar';
import useNavigate from '@/utils/use_navigate';
import deleteCurrentSession from '@/server/api/delete_current_session';
import clearApiCache from '@/utils/clear_api_cache';
import ExtraInfo from './extra_info';
import { isKeyboardEventComposing } from '@/utils/keyboard';

const AVATAR_SIZE = 120;
const Style = styled(Page)`
  padding: 20px ${PAGE_HORIZONTAL_PADDING};
  padding-bottom: calc(20px + ${FLOATING_CONTROLLER_SCROLL_SPACE});

  overflow: auto;
  ${autoScrollbar}

  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const ProfileCard = styled.section`
  display: flex;
  align-items: center;
  /* 头像横向位置由页面容器控制，确保宽屏和窄屏都与下方内容对齐。 */
  padding: 20px 0;

  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};

  > .avatar-box {
    display: flex;
    align-items: center;
    gap: 10px;

    > .avatar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      > .avatar-action {
        margin-bottom: 0;
      }
    }
  }

  @media (max-width: 720px) {
    > .avatar-box {
      align-items: center;
    }
  }
`;
const FieldGrid = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const NicknameSection = styled.section`
  width: 100%;

  > .row {
    display: flex;
    width: 100%;
    align-items: flex-end;
    gap: 12px;

    > .input {
      flex: 1;
      min-width: 0;
    }

    > .button {
      flex-shrink: 0;
    }
  }
`;
const ActionGrid = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

function clearCurrentUser() {
  const selectedServer = getSelectedServer(useServer.getState());
  if (!selectedServer) return;
  useServer.setState((server) => ({
    serverList: server.serverList.map((s) =>
      s.origin === selectedServer.origin
        ? {
            ...s,
            users: s.users.filter((u) => u.id !== s.selectedUserId),
            selectedUserId: undefined,
          }
        : s,
    ),
  }));
}

function User() {
  const user = useUser()!;
  const navigate = useNavigate();
  const { playqueue, currentPlayqueuePosition } = useContext(context);
  const queueMusic = playqueue[currentPlayqueuePosition];
  const [nickname, setNickname] = useState(user.nickname);
  const [nicknameUpdating, setNicknameUpdating] = useState(false);

  useEffect(() => {
    setNickname(user.nickname);
  }, [user.nickname]);

  const trimmedNickname = nickname.replace(/\s+/g, ' ').trim();
  const nicknameChanged = trimmedNickname !== user.nickname;
  const nicknameError =
    nickname.length > 0 && !trimmedNickname ? t('empty_nickname_warning') : '';
  const canUpdateNickname =
    !nicknameUpdating && !!trimmedNickname && nicknameChanged;

  const editAvatar = () =>
    dialog.imageCut({
      title: t('edit_avatar'),
      inlineFooter: true,
      cancelVariant: 'ghost',
      onConfirm: async (avatar) => {
        if (!avatar) {
          notice.error(t('empty_avatar_warning'));
          return false;
        }
        try {
          const { id } = await uploadAsset(avatar, AssetType.USER_AVATAR);
          await updateProfile({
            key: AllowUpdateKey.AVATAR,
            value: id,
          });
          await reloadUser();
        } catch (error) {
          logger.error(error, 'Failed to update avatar');
          notice.error(error.message);
          return false;
        }
      },
    });

  const openUserDrawer = () =>
    playerEventemitter.emit(EventType.OPEN_USER_DRAWER, {
      id: user.id,
    });

  const updateNickname = async () => {
    if (!canUpdateNickname) {
      if (!trimmedNickname) {
        notice.error(t('empty_nickname_warning'));
      }
      return;
    }

    setNicknameUpdating(true);
    try {
      await updateProfile({
        key: AllowUpdateKey.NICKNAME,
        value: trimmedNickname,
      });
      await reloadUser();
    } catch (error) {
      logger.error(error, 'Failed to update nickname');
      notice.error(error.message);
    }
    setNicknameUpdating(false);
  };

  const onNicknameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isKeyboardEventComposing(event) && event.key === 'Enter') {
      event.preventDefault();
      void updateNickname();
    }
  };

  const changePassword = () =>
    dialog.input({
      label: user.twoFAEnabled
        ? t('password_or_2fa_token')
        : t('current_password'),
      inputType: 'password',
      confirmVariant: 'primary',
      onConfirm: (credential) => {
        if (!credential) {
          return false;
        }
        dialog.password({
          confirmVariant: 'primary',
          onConfirm: async (password) => {
            try {
              await updateProfile({
                key: AllowUpdateKey.PASSWORD,
                value: {
                  password,
                  currentPassword: credential,
                  twoFAToken: credential,
                },
              });
              notice.info(t('password_has_changed'));
            } catch (error) {
              logger.error(error, 'Failed to update password');
              dialog.alert({ content: error.message });
              return false;
            }
          },
        });
      },
    });

  const switchUser = () => {
    const toLogin = () => {
      clearApiCache();
      navigate({ path: ROOT_PATH.LOGIN });
    };

    if (!queueMusic) {
      toLogin();
      return;
    }

    dialog.confirm({
      content: t('switch_user_question'),
      onConfirm: toLogin,
    });
  };

  const logout = () =>
    dialog.confirm({
      content: t('logout_question'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCurrentSession();
        } catch (error) {
          logger.error(error, 'Failed to revoke current session');
        }
        clearApiCache();
        navigate({ replace: true, path: ROOT_PATH.LOGIN });
        window.setTimeout(clearCurrentUser, 0);
      },
    });

  return (
    <Style>
      <ProfileCard>
        <div className="avatar-box">
          <Avatar
            src={getResizedImage({
              url: user.avatar,
              size: Math.ceil(AVATAR_SIZE * window.devicePixelRatio),
            })}
            size={AVATAR_SIZE}
          />
          <div className="avatar-actions">
            <Button
              className="avatar-action"
              variant="secondary"
              size="sm"
              square
              onClick={editAvatar}
              title={t('edit_avatar')}
              aria-label={t('edit_avatar')}
            >
              <IconEdit size={18} />
            </Button>
            <Button
              className="avatar-action"
              variant="secondary"
              size="sm"
              onClick={openUserDrawer}
            >
              {t('view_personal_homepage')}
            </Button>
          </div>
        </div>
      </ProfileCard>

      <FieldGrid>
        <NicknameSection>
          <div className="row">
            <Input
              className="input"
              label={t('nickname')}
              value={nickname}
              maxLength={NICKNAME_MAX_LENGTH}
              onChange={(event) => setNickname(event.target.value)}
              onKeyDown={onNicknameKeyDown}
              error={nicknameError}
            />
            <Button
              className="button"
              variant="primary"
              onClick={() => void updateNickname()}
              disabled={!canUpdateNickname}
              loading={nicknameUpdating}
            >
              {t('save')}
            </Button>
          </div>
        </NicknameSection>
        <Input
          label={t('username')}
          value={user.username}
          disabled
        />
        <Input
          label={t('join_time')}
          value={day(user.joinTimestamp).format('YYYY-MM-DD')}
          disabled
        />
      </FieldGrid>

      <ActionGrid>
        <Button
          block
          variant="ghost"
          onClick={changePassword}
          icon={<MdPassword />}
        >
          {t('change_password')}
        </Button>
        <Button
          block
          variant="ghost"
          onClick={() =>
            playerEventemitter.emit(EventType.OPEN_2FA_DIALOG, null)
          }
          icon={<MdSecurity />}
        >
          {user.twoFAEnabled ? t('disable_2fa') : t('enable_2fa')}
        </Button>
        <Button
          block
          variant="ghost"
          onClick={() =>
            playerEventemitter.emit(
              EventType.OPEN_AUTHORIZED_DEVICE_DRAWER,
              null,
            )
          }
          icon={<MdDevicesOther />}
        >
          {t('authorized_devices')}
        </Button>
        <Button
          block
          variant="ghost"
          onClick={switchUser}
          icon={<MdSwitchAccount />}
        >
          {t('switch_user')}
        </Button>
        <Button
          block
          variant="danger"
          onClick={logout}
          icon={<MdLogout />}
        >
          {t('logout')}
        </Button>
      </ActionGrid>

      <ExtraInfo />
    </Style>
  );
}

export default memo(User);
