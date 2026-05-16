import styled from 'styled-components';
import Input from '@/components/input';
import { Label } from '@/components';
import Textarea from '@/components/textarea';
import Button from '@/components/button';
import day from '@/utils/day';
import { ChangeEventHandler, useState } from 'react';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import dialog from '@/utils/dialog';
import adminUpdateUser from '@/server/api/admin_update_user';
import adminUpdateUserAdmin from '@/server/api/admin_update_user_admin';
import { useUser } from '@/global_states/server';
import {
  AdminAllowUpdateKey,
  REMARK_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@/constants/user';
import adminDeleteUser from '@/server/api/admin_delete_user';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { User } from '../constants';
import e, { EventType } from '../eventemitter';

const Style = styled.div`
  > .part {
    margin: 20px;
    display: block;
    width: calc(100% - 40px);
  }
`;

const AdminField = styled.div`
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
`;

const AdminFieldTitle = styled.div`
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 800;
  text-transform: capitalize;
`;

const SwitchButton = styled.button<{ $checked: boolean }>`
  position: relative;
  flex: 0 0 auto;
  width: 58px;
  height: 34px;
  padding: 3px;
  border: 2px solid
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_CONTROL_NEUTRAL};
  border-radius: 999px;
  background: ${({ $checked }) =>
    $checked ? CSSVariable.COLOR_PRIMARY : '#fff'};
  box-shadow: 0 4px 0
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_CONTROL_NEUTRAL};
  cursor: pointer;
  transition:
    transform 150ms ease-out,
    background 150ms ease,
    box-shadow 150ms ease,
    filter 120ms;

  &:not(:disabled):hover {
    filter: brightness(1.04);
  }

  &:not(:disabled):active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: saturate(0.45);
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
  }

  > .thumb {
    display: block;
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    border: 2px solid
      ${({ $checked }) =>
        $checked
          ? CSSVariable.COLOR_PRIMARY_ACTIVE
          : CSSVariable.COLOR_CONTROL_NEUTRAL};
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 0
      ${({ $checked }) =>
        $checked
          ? CSSVariable.COLOR_PRIMARY_ACTIVE
          : CSSVariable.COLOR_CONTROL_NEUTRAL};
    transform: translateX(${({ $checked }) => ($checked ? '24px' : '0')});
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

function UserEdit({ user, onClose }: { user: User; onClose: () => void }) {
  const currentUser = useUser();
  const isCurrentUser = currentUser?.id === user.id;

  const [username, setUsername] = useState(user.username);
  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUsername(event.target.value.trim());

  const [remark, setRemark] = useState(user.remark);
  const onRemarkChange: ChangeEventHandler<HTMLTextAreaElement> = (event) =>
    setRemark(event.target.value);

  const [admin, setAdmin] = useState(!!user.admin);
  const [loading, setLoading] = useState(false);
  const [adminUpdating, setAdminUpdating] = useState(false);
  const busy = loading || adminUpdating;

  const onSave = async () => {
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
        if (remark.length > REMARK_MAX_LENGTH) {
          throw new Error(
            t(
              'should_be_less_than_or_equal_to',
              t('length_of', t('remark')),
              REMARK_MAX_LENGTH.toString(),
            ),
          );
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.REMARK,
          value: remark,
        });
        updated = true;
      }

      onClose();
    } catch (error) {
      logger.error(error, 'Failed to update user info');
      notice.error(error.message);
    }

    if (updated) {
      e.emit(EventType.USER_UPDATED, null);
    }

    setLoading(false);
  };

  const updateAdmin = async (nextAdmin: boolean) => {
    setAdminUpdating(true);
    try {
      await adminUpdateUserAdmin({
        id: user.id,
        admin: nextAdmin,
      });
      setAdmin(nextAdmin);
      e.emit(EventType.USER_UPDATED, null);
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
    <Style>
      <Style>
        <AdminField className="part">
          <AdminFieldTitle>{t('admin')}</AdminFieldTitle>
          <SwitchButton
            type="button"
            role="switch"
            aria-checked={admin}
            aria-label={t('admin')}
            $checked={admin}
            disabled={busy || isCurrentUser}
            onClick={() => void onAdminToggle()}
          >
            <span className="thumb" />
          </SwitchButton>
        </AdminField>
        <Input
          className="part"
          label={t('username')}
          disabled={busy}
          value={username}
          onChange={onUsernameChange}
          maxLength={USERNAME_MAX_LENGTH}
        />
        <Input
          className="part"
          label={t('nickname')}
          disabled
          defaultValue={user.nickname}
        />
        <Input
          className="part"
          label={t('join_time')}
          disabled
          defaultValue={day(user.joinTimestamp).format('YYYY-MM-DD')}
        />
        <Label label={t('remark')} className="part">
          <Textarea
            disabled={busy}
            value={remark}
            onChange={onRemarkChange}
            rows={5}
          />
        </Label>
        <Button
          className="part"
          variant={'primary'}
          onClick={onSave}
          loading={loading}
          disabled={adminUpdating}
        >
          {t('save')}
        </Button>
        {isCurrentUser ? null : (
          <Button
            className="part"
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
            className="part"
            variant={'danger'}
            disabled={busy}
            onClick={() =>
              dialog.confirm({
                title: t('delete_user_question'),
                content: t('delete_user_question_content'),
                confirmText: t('continue'),
                onConfirm: () =>
                  void dialog.captcha({
                    confirmText: t('delete_user'),
                    confirmVariant: 'danger',
                    onConfirm: async ({ captchaId, captchaValue }) => {
                      try {
                        await adminDeleteUser({
                          id: user.id,
                          captchaId,
                          captchaValue,
                        });
                        onClose();
                        e.emit(EventType.USER_DELETED, { id: user.id });
                      } catch (error) {
                        logger.error(error, 'Failed to delete user');
                        notice.error(error.message);
                        return false;
                      }
                    },
                  }),
              })
            }
          >
            {t('delete_user')}
          </Button>
        )}
      </Style>
    </Style>
  );
}

export default UserEdit;
