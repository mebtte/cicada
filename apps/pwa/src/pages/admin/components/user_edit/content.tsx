import { ChangeEventHandler, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Delete, Key, Save } from '@/components/icon';
import Avatar from '@/components/avatar';
import Button from '@/components/button';
import Input from '@/components/input';
import { Label } from '@/components';
import Switch from '@/components/switch';
import Textarea from '@/components/textarea';
import { CSSVariable } from '@/global_style';
import {
  AdminAllowUpdateKey,
  REMARK_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@/constants/user';
import { useUser } from '@/global_states/server';
import adminDeleteUser from '@/server/api/admin_delete_user';
import adminUpdateUser from '@/server/api/admin_update_user';
import adminUpdateUserAdmin from '@/server/api/admin_update_user_admin';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import day from '@/utils/day';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import type { User } from './types';

const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const AVATAR_SIZE = 88;

const Root = styled.div`
  min-height: 100%;
  padding: 18px;
  background: #fff;
  font-family: ${FONT};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 4px 0;
`;

const Form = styled.div`
  padding-top: 16px;
  display: grid;
  gap: 16px;
`;

const TextareaBox = styled(Label)`
  display: grid;
  gap: 6px;

  textarea {
    min-height: 112px;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    border-radius: 13px;
    box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    font-family: ${FONT};
    font-weight: 600;
    resize: vertical;

    &:focus {
      border-color: var(--cicada-color-primary-shadow);
      box-shadow: 0 4px 0 var(--cicada-color-primary-shadow);
    }
  }
`;

const SwitchField = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 44px;
`;

const SwitchTitle = styled.div`
  color: rgb(75 75 75);
  font-size: 14px;
  font-weight: 800;
  text-transform: capitalize;
`;

const ActionList = styled.div`
  margin-top: 20px;
  display: grid;
  gap: 12px;
`;

function UserEditContent({
  user,
  onClose,
  onSaved,
  onDeleted,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: (id: string) => void;
}) {
  const currentUser = useUser();
  const isCurrentUser = currentUser?.id === user.id;
  const [username, setUsername] = useState(user.username);
  const [remark, setRemark] = useState(user.remark);
  const [admin, setAdmin] = useState(!!user.admin);
  const [loading, setLoading] = useState(false);
  const [adminUpdating, setAdminUpdating] = useState(false);

  useEffect(() => {
    setAdmin(!!user.admin);
  }, [user.admin, user.id]);

  const avatarSrc = useMemo(
    () =>
      user.avatar
        ? getResizedImage({
            url: user.avatar,
            size: AVATAR_SIZE * 2,
          })
        : null,
    [user.avatar],
  );
  const changed =
    user.username !== username ||
    user.remark !== remark;
  const busy = loading || adminUpdating;

  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUsername(event.target.value.trim());

  const onSave = async () => {
    if (!username) {
      notice.error(t('empty_name_warning'));
      return;
    }
    if (remark.length > REMARK_MAX_LENGTH) {
      notice.error(
        t(
          'should_be_less_than_or_equal_to',
          t('length_of', t('remark')),
          REMARK_MAX_LENGTH.toString(),
        ),
      );
      return;
    }

    setLoading(true);
    let updated = false;
    try {
      if (user.username !== username) {
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.USERNAME,
          value: username,
        });
        updated = true;
      }

      if (user.remark !== remark) {
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.REMARK,
          value: remark,
        });
        updated = true;
      }

      if (updated) {
        onSaved();
      }
      onClose();
    } catch (error) {
      logger.error(error, 'Failed to update user info');
      notice.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAdmin = async (nextAdmin: boolean) => {
    setAdminUpdating(true);
    try {
      await adminUpdateUserAdmin({
        id: user.id,
        admin: nextAdmin,
      });
      setAdmin(nextAdmin);
      onSaved();
      return true;
    } catch (error) {
      logger.error(error, 'Failed to update admin role');
      notice.error(error.message);
      return false;
    } finally {
      setAdminUpdating(false);
    }
  };

  const onAdminToggle = () => {
    if (isCurrentUser) {
      return;
    }

    const nextAdmin = !admin;
    if (nextAdmin) {
      dialog.confirm({
        title: t('set_as_admin_question'),
        confirmText: t('set_as_admin'),
        confirmVariant: 'primary',
        onConfirm: () => updateAdmin(nextAdmin),
      });
      return;
    }

    dialog.confirm({
      title: t('unset_as_admin_question'),
      confirmText: t('unset_as_admin'),
      confirmVariant: 'danger',
      onConfirm: () => updateAdmin(nextAdmin),
    });
  };

  return (
    <Root>
      {avatarSrc ? (
        <Header>
          <Avatar src={avatarSrc} size={AVATAR_SIZE} />
        </Header>
      ) : null}

      <Form>
        <SwitchField>
          <SwitchTitle>{t('admin')}</SwitchTitle>
          <Switch
            checked={admin}
            aria-label={t('admin')}
            disabled={busy || isCurrentUser}
            onClick={() => void onAdminToggle()}
          />
        </SwitchField>
        <Input
          label={t('username')}
          disabled={busy}
          value={username}
          onChange={onUsernameChange}
          maxLength={USERNAME_MAX_LENGTH}
        />
        <Input label={t('nickname')} disabled value={user.nickname} />
        <Input
          label={t('join_time')}
          disabled
          value={day(user.joinTimestamp).format('YYYY-MM-DD HH:mm')}
        />
        <TextareaBox label={t('remark')}>
          <Textarea
            disabled={busy}
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
            rows={5}
            maxLength={REMARK_MAX_LENGTH}
          />
        </TextareaBox>
      </Form>

      <ActionList>
        <Button
          type="button"
          variant="primary"
          icon={<Save />}
          loading={loading}
          disabled={adminUpdating || !changed || !username}
          onClick={onSave}
        >
          {t('save')}
        </Button>
        {isCurrentUser ? null : (
          <Button
            type="button"
            variant="ghost"
            icon={<Key />}
            disabled={busy}
            onClick={() =>
              dialog.password({
                confirmVariant: 'primary',
                onConfirm: async (password) => {
                  try {
                    await adminUpdateUser({
                      id: user.id,
                      key: AdminAllowUpdateKey.PASSWORD,
                      value: password,
                    });
                    notice.info(t('password_has_changed'));
                    onClose();
                  } catch (error) {
                    logger.error(error, 'Failed to change password');
                    dialog.alert({ content: error.message });
                    return false;
                  }
                },
              })
            }
          >
            {t('change_password')}
          </Button>
        )}
        {admin ? null : (
          <Button
            type="button"
            variant="danger"
            icon={<Delete />}
            disabled={busy}
            onClick={() =>
              dialog.captcha({
                title: t('delete_user_question'),
                content: t('delete_user_question_content'),
                confirmText: t('delete_user'),
                confirmVariant: 'danger',
                onConfirm: async ({ captchaId, captchaValue }) => {
                  try {
                    await adminDeleteUser({
                      id: user.id,
                      captchaId,
                      captchaValue,
                    });
                    onDeleted(user.id);
                    onClose();
                  } catch (error) {
                    logger.error(error, 'Failed to delete user');
                    notice.error(error.message);
                    return false;
                  }
                },
              })
            }
          >
            {t('delete_user')}
          </Button>
        )}
      </ActionList>
    </Root>
  );
}

export default UserEditContent;
