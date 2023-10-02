import styled from 'styled-components';
import Input from '@/components/input';
import Label from '@/components/label';
import Textarea from '@/components/textarea';
import Button, { Variant } from '@/components/button';
import day from '#/utils/day';
import { ChangeEventHandler, useState } from 'react';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import dialog from '@/utils/dialog';
import adminUpdateUser from '@/server/api/admin_update_user';
import adminUpdateUserAdmin from '@/server/api/admin_update_user_admin';
import {
  AdminAllowUpdateKey,
  REMARK_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '#/constants/user';
import adminDeleteUser from '@/server/api/admin_delete_user';
import { t } from '@/i18n';
import { User } from '../constants';
import e, { EventType } from '../eventemitter';

const Style = styled.div`
  > .part {
    margin: 20px;
    display: block;
    width: calc(100% - 40px);
  }
`;

function UserEdit({ user, onClose }: { user: User; onClose: () => void }) {
  const [musicbillMaxAmount, setMusicbillMaxAmount] = useState(() =>
    user.musicbillMaxAmount.toString(),
  );
  const onMusicbillMacAmountChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => setMusicbillMaxAmount(event.target.value.replace(/[\D.]/, ''));

  const [username, setUsername] = useState(user.username);
  const onUsernameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setUsername(event.target.value.trim());

  const [createMusicMaxAmountPerDay, setCreateMusicMaxAmountPerDay] = useState(
    () => user.createMusicMaxAmountPerDay.toString(),
  );
  const onCreateMusicMaxAmountPerDayChange: ChangeEventHandler<
    HTMLInputElement
  > = (event) =>
    setCreateMusicMaxAmountPerDay(event.target.value.replace(/[\D.]/, ''));

  const [musicPlayRecordIndate, setMusicPlayRecordIndate] = useState(() =>
    user.musicPlayRecordIndate.toString(),
  );
  const onMusicPlayRecordIndateChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => setMusicPlayRecordIndate(event.target.value.replace(/[\D.]/, ''));

  const [remark, setRemark] = useState(user.remark);
  const onRemarkChange: ChangeEventHandler<HTMLTextAreaElement> = (event) =>
    setRemark(event.target.value);

  const [loading, setLoading] = useState(false);
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

      const musicbillMaxAmountNumber = Number(musicbillMaxAmount);
      if (user.musicbillMaxAmount !== musicbillMaxAmountNumber) {
        if (musicbillMaxAmountNumber < 0) {
          throw new Error(
            t('should_be_greater_than', t('maximum_amount_of_musicbill'), '0'),
          );
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.MUSICBILL_MAX_AMOUNT,
          value: musicbillMaxAmountNumber,
        });
        updated = true;
      }

      const createMusicMaxAmountPerDayNumber = Number(
        createMusicMaxAmountPerDay,
      );
      if (
        user.createMusicMaxAmountPerDay !== createMusicMaxAmountPerDayNumber
      ) {
        if (createMusicMaxAmountPerDayNumber < 0) {
          throw new Error(
            t(
              'should_be_greater_than_or_equal_to',
              t('maximum_amount_of_creating_music_per_day'),
              '0',
            ),
          );
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
          value: createMusicMaxAmountPerDayNumber,
        });
        updated = true;
      }

      const musicPlayRecordIndateNumber = Number(musicPlayRecordIndate);
      if (user.musicPlayRecordIndate !== musicPlayRecordIndateNumber) {
        if (musicPlayRecordIndateNumber < 0) {
          throw new Error(
            t(
              'should_be_greater_than_or_equal_to',
              t('music_play_record_indate'),
              '0',
            ),
          );
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.MUSIC_PLAY_RECORD_INDATE,
          value: musicPlayRecordIndateNumber,
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

  return (
    <Style>
      <Style>
        <Label className="part" label="ID">
          <Input disabled defaultValue={user.id} />
        </Label>
        <Label className="part" label={t('nickname')}>
          <Input disabled defaultValue={user.nickname} />
        </Label>
        <Label className="part" label={t('join_time')}>
          <Input
            disabled
            defaultValue={day(user.joinTimestamp).format('YYYY-MM-DD')}
          />
        </Label>
        <Label className="part" label={t('username')}>
          <Input
            disabled={loading}
            value={username}
            onChange={onUsernameChange}
            maxLength={USERNAME_MAX_LENGTH}
          />
        </Label>
        <Label
          className="part"
          label={`${t('maximum_amount_of_musicbill')}(${t(
            'zero_means_unlimited',
          )})`}
        >
          <Input
            disabled={loading}
            value={musicbillMaxAmount}
            onChange={onMusicbillMacAmountChange}
          />
        </Label>
        <Label
          className="part"
          label={`${t('maximum_amount_of_creating_music_per_day')}(${t(
            'zero_means_unlimited',
          )})`}
        >
          <Input
            disabled={loading}
            value={createMusicMaxAmountPerDay}
            onChange={onCreateMusicMaxAmountPerDayChange}
          />
        </Label>
        <Label
          className="part"
          label={`${t('music_play_record_indate')}(${t(
            'zero_means_unlimited',
          )})`}
        >
          <Input
            disabled={loading}
            value={musicPlayRecordIndate}
            onChange={onMusicPlayRecordIndateChange}
          />
        </Label>
        <Label label={t('remark')} className="part">
          <Textarea
            disabled={loading}
            value={remark}
            onChange={onRemarkChange}
            rows={5}
          />
        </Label>
        <Button
          className="part"
          variant={Variant.PRIMARY}
          onClick={onSave}
          loading={loading}
        >
          {t('save')}
        </Button>
        {user.admin ? null : (
          <Button
            className="part"
            disabled={loading}
            onClick={() =>
              dialog.confirm({
                title: t('set_as_admin_question'),
                content: t('set_as_admin_question_content'),
                confirmText: t('continue'),
                onConfirm: () =>
                  void dialog.captcha({
                    confirmText: t('set_as_admin'),
                    confirmVariant: Variant.PRIMARY,
                    onConfirm: async ({ captchaId, captchaValue }) => {
                      try {
                        await adminUpdateUserAdmin({
                          id: user.id,
                          captchaId,
                          captchaValue,
                        });
                        onClose();
                        e.emit(EventType.USER_UPDATED, null);
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
        <Button
          className="part"
          disabled={loading}
          onClick={() =>
            dialog.password({
              confirmVariant: Variant.PRIMARY,
              onConfirm: async (password) => {
                try {
                  await adminUpdateUser({
                    id: user.id,
                    key: AdminAllowUpdateKey.PASSWORD,
                    value: password,
                  });

                  if (user.twoFAEnabled) {
                    notice.info(t('2fa_has_disabled'));
                  }
                  notice.info(t('password_has_changed'));

                  onClose();
                } catch (error) {
                  logger.error(error, 'Failed to change password');
                  notice.error(error.message);
                  return false;
                }
              },
            })
          }
        >
          {user.twoFAEnabled ? `${t('disable_2fa')} / ` : null}
          {t('change_password')}
        </Button>
        {user.admin ? null : (
          <Button
            className="part"
            variant={Variant.DANGER}
            disabled={loading}
            onClick={() =>
              dialog.confirm({
                title: t('delete_user_question'),
                content: t('delete_user_question_content'),
                confirmText: t('continue'),
                onConfirm: () =>
                  void dialog.captcha({
                    confirmText: t('delete_user'),
                    confirmVariant: Variant.DANGER,
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
