import { ChangeEventHandler, useMemo, useState } from 'react';
import styled from 'styled-components';
import { MdAdminPanelSettings, MdDeleteOutline, MdKey, MdSave } from 'react-icons/md';
import Avatar from '@/components/avatar';
import Button from '@/components/button';
import Input from '@/components/input';
import { Label } from '@/components';
import Textarea from '@/components/textarea';
import DefaultCover from '@/asset/default_cover.jpeg';
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
const ROW_SHADOW = 'rgb(232 232 232)';
const AVATAR_SIZE = 72;

const Root = styled.div`
  min-height: 100%;
  padding: 18px;
  background: #fff;
  font-family: ${FONT};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 4px 18px;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
`;

const HeaderText = styled.div`
  min-width: 0;
  flex: 1;
`;

const Nickname = styled.div`
  color: rgb(75 75 75);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Account = styled.div`
  margin-top: 5px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span<{ $admin?: boolean }>`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  margin-top: 10px;
  padding: 4px 8px;
  border: 2px solid
    ${({ $admin }) =>
      $admin ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 0
    ${({ $admin }) =>
      $admin ? 'var(--cicada-color-primary-shadow)' : ROW_SHADOW};
  color: ${({ $admin }) =>
    $admin ? CSSVariable.COLOR_PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Form = styled.div`
  padding-top: 18px;
  display: grid;
  gap: 16px;
`;

const TextareaBox = styled(Label)`
  display: grid;
  gap: 6px;

  textarea {
    min-height: 112px;
    border: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 13px;
    box-shadow: 0 4px 0 rgb(185 185 185);
    font-family: ${FONT};
    font-weight: 600;
    resize: vertical;

    &:focus {
      border-color: ${CSSVariable.COLOR_PRIMARY};
      box-shadow: 0 4px 0 var(--cicada-color-primary-shadow);
    }
  }
`;

const ActionList = styled.div`
  margin-top: 20px;
  padding-top: 18px;
  border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  display: grid;
  gap: 12px;
`;

const normalizeUnsignedIntegerInput = (value: string) =>
  value.replace(/\D/g, '');

const toNumber = (value: string) => Number(value || 0);

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
  const [musicbillMaxAmount, setMusicbillMaxAmount] = useState(() =>
    user.musicbillMaxAmount.toString(),
  );
  const [createMusicMaxAmountPerDay, setCreateMusicMaxAmountPerDay] = useState(
    () => user.createMusicMaxAmountPerDay.toString(),
  );
  const [musicPlayRecordIndate, setMusicPlayRecordIndate] = useState(() =>
    user.musicPlayRecordIndate.toString(),
  );
  const [remark, setRemark] = useState(user.remark);
  const [loading, setLoading] = useState(false);

  const avatarSrc = useMemo(
    () =>
      getResizedImage({
        url: user.avatar || DefaultCover,
        size: AVATAR_SIZE * 2,
      }),
    [user.avatar],
  );
  const changed =
    user.username !== username ||
    user.musicbillMaxAmount !== toNumber(musicbillMaxAmount) ||
    user.createMusicMaxAmountPerDay !== toNumber(createMusicMaxAmountPerDay) ||
    user.musicPlayRecordIndate !== toNumber(musicPlayRecordIndate) ||
    user.remark !== remark;

  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUsername(event.target.value.trim());
  const onMusicbillMaxAmountChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => setMusicbillMaxAmount(normalizeUnsignedIntegerInput(event.target.value));
  const onCreateMusicMaxAmountPerDayChange: ChangeEventHandler<
    HTMLInputElement
  > = (event) =>
    setCreateMusicMaxAmountPerDay(
      normalizeUnsignedIntegerInput(event.target.value),
    );
  const onMusicPlayRecordIndateChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) =>
    setMusicPlayRecordIndate(normalizeUnsignedIntegerInput(event.target.value));

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

      const nextMusicbillMaxAmount = toNumber(musicbillMaxAmount);
      if (user.musicbillMaxAmount !== nextMusicbillMaxAmount) {
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.MUSICBILL_MAX_AMOUNT,
          value: nextMusicbillMaxAmount,
        });
        updated = true;
      }

      const nextCreateMusicMaxAmountPerDay = toNumber(
        createMusicMaxAmountPerDay,
      );
      if (
        user.createMusicMaxAmountPerDay !== nextCreateMusicMaxAmountPerDay
      ) {
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
          value: nextCreateMusicMaxAmountPerDay,
        });
        updated = true;
      }

      const nextMusicPlayRecordIndate = toNumber(musicPlayRecordIndate);
      if (user.musicPlayRecordIndate !== nextMusicPlayRecordIndate) {
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.MUSIC_PLAY_RECORD_INDATE,
          value: nextMusicPlayRecordIndate,
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

  return (
    <Root>
      <Header>
        <Avatar src={avatarSrc} size={AVATAR_SIZE} />
        <HeaderText>
          <Nickname title={user.nickname || user.username}>
            {user.nickname || user.username}
          </Nickname>
          <Account title={user.id}>@{user.username}</Account>
          <Badge $admin={!!user.admin}>
            {user.admin ? t('admin') : t('user')}
          </Badge>
        </HeaderText>
      </Header>

      <Form>
        <Input label={t('user_id')} disabled value={user.id} />
        <Input label={t('nickname')} disabled value={user.nickname} />
        <Input
          label={t('join_time')}
          disabled
          value={day(user.joinTimestamp).format('YYYY-MM-DD HH:mm')}
        />
        <Input
          label={t('username')}
          disabled={loading}
          value={username}
          onChange={onUsernameChange}
          maxLength={USERNAME_MAX_LENGTH}
        />
        <Input
          label={`${t('maximum_amount_of_musicbill')} (${t('zero_means_unlimited')})`}
          disabled={loading}
          value={musicbillMaxAmount}
          onChange={onMusicbillMaxAmountChange}
        />
        <Input
          label={`${t('maximum_amount_of_creating_music_per_day')} (${t('zero_means_unlimited')})`}
          disabled={loading}
          value={createMusicMaxAmountPerDay}
          onChange={onCreateMusicMaxAmountPerDayChange}
        />
        <Input
          label={`${t('music_play_record_indate')} (${t('zero_means_unlimited')})`}
          disabled={loading}
          value={musicPlayRecordIndate}
          onChange={onMusicPlayRecordIndateChange}
        />
        <TextareaBox label={t('remark')}>
          <Textarea
            disabled={loading}
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
          icon={<MdSave />}
          loading={loading}
          disabled={!changed || !username}
          onClick={onSave}
        >
          {t('save')}
        </Button>
        {user.admin ? null : (
          <Button
            type="button"
            variant="secondary"
            icon={<MdAdminPanelSettings />}
            disabled={loading}
            onClick={() =>
              dialog.confirm({
                title: t('set_as_admin_question'),
                content: t('set_as_admin_question_content'),
                confirmText: t('continue'),
                onConfirm: () =>
                  void dialog.captcha({
                    confirmText: t('set_as_admin'),
                    confirmVariant: 'primary',
                    onConfirm: async ({ captchaId, captchaValue }) => {
                      try {
                        await adminUpdateUserAdmin({
                          id: user.id,
                          captchaId,
                          captchaValue,
                        });
                        onSaved();
                        onClose();
                      } catch (error) {
                        logger.error(error, 'Failed to set admin');
                        notice.error(error.message);
                        return false;
                      }
                    },
                  }),
              })
            }
          >
            {t('set_as_admin')}
          </Button>
        )}
        {isCurrentUser ? null : (
          <Button
            type="button"
            variant="ghost"
            icon={<MdKey />}
            disabled={loading}
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
        {user.admin ? null : (
          <Button
            type="button"
            variant="danger"
            icon={<MdDeleteOutline />}
            disabled={loading}
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
                        onDeleted(user.id);
                        onClose();
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
      </ActionList>
    </Root>
  );
}

export default UserEditContent;
