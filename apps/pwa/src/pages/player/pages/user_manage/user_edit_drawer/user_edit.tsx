import styled from 'styled-components';
import Input from '@/components/input';
import Textarea from '@/components/textarea';
import Button, { Variant } from '@/components/button';
import day from '#/utils/day';
import { ChangeEventHandler, useState } from 'react';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import dialog from '@/utils/dialog';
import adminUpdateUser from '@/server/api/admin_update_user';
import adminUpdateUserAdmin from '@/server/api/admin_update_user_admin';
import { AdminAllowUpdateKey, REMARK_MAX_LENGTH } from '#/constants/user';
import adminDeleteUser from '@/server/api/admin_delete_user';
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

  const [createMusicMaxAmountPerDay, setCreateMusicMaxAmountPerDay] = useState(
    () => user.createMusicMaxAmountPerDay.toString(),
  );
  const onCreateMusicMaxAmountPerDayChange: ChangeEventHandler<
    HTMLInputElement
  > = (event) =>
    setCreateMusicMaxAmountPerDay(event.target.value.replace(/[\D.]/, ''));

  const [exportMusicbillMaxTimePerDay, setExportMusicbillMaxTimePerDay] =
    useState(() => user.exportMusicbillMaxTimePerDay.toString());
  const onExportMusicbillMaxTimePerDayChange: ChangeEventHandler<
    HTMLInputElement
  > = (event) =>
    setExportMusicbillMaxTimePerDay(event.target.value.replace(/[\D.]/, ''));

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

    try {
      const musicbillMaxAmountNumber = Number(musicbillMaxAmount);
      if (user.musicbillMaxAmount !== musicbillMaxAmountNumber) {
        if (musicbillMaxAmountNumber < 0) {
          throw new Error('歌单最大数量应大于等于 0');
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.MUSICBILL_MAX_AMOUNT,
          value: musicbillMaxAmountNumber,
        });
        e.emit(EventType.USER_UPDATED, {
          id: user.id,
          musicbillMaxAmount: musicbillMaxAmountNumber,
        });
      }

      const createMusicMaxAmountPerDayNumber = Number(
        createMusicMaxAmountPerDay,
      );
      if (
        user.createMusicMaxAmountPerDay !== createMusicMaxAmountPerDayNumber
      ) {
        if (createMusicMaxAmountPerDayNumber < 0) {
          throw new Error('每天创建音乐最大数量应大于等于 0');
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.CREATE_MUSIC_MAX_AMOUNT_PER_DAY,
          value: createMusicMaxAmountPerDayNumber,
        });
        e.emit(EventType.USER_UPDATED, {
          id: user.id,
          createMusicMaxAmountPerDay: createMusicMaxAmountPerDayNumber,
        });
      }

      const exportMusicbillMaxTimePerDayNumber = Number(
        exportMusicbillMaxTimePerDay,
      );
      if (
        user.exportMusicbillMaxTimePerDay !== exportMusicbillMaxTimePerDayNumber
      ) {
        if (exportMusicbillMaxTimePerDayNumber < 0) {
          throw new Error('每天导出乐单最大数量应大于等于 0');
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.EXPORT_MUSICBILL_MAX_TIME_PER_DAY,
          value: exportMusicbillMaxTimePerDayNumber,
        });
        e.emit(EventType.USER_UPDATED, {
          id: user.id,
          exportMusicbillMaxTimePerDay: exportMusicbillMaxTimePerDayNumber,
        });
      }

      const musicPlayRecordIndateNumber = Number(musicPlayRecordIndate);
      if (user.musicPlayRecordIndate !== musicPlayRecordIndateNumber) {
        if (musicPlayRecordIndateNumber < 0) {
          throw new Error('音乐播放记录保留天数应大于等于 0');
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.MUSIC_PLAY_RECORD_INDATE,
          value: musicPlayRecordIndateNumber,
        });
        e.emit(EventType.USER_UPDATED, {
          id: user.id,
          musicPlayRecordIndate: musicPlayRecordIndateNumber,
        });
      }

      if (user.remark !== remark) {
        if (remark.length > REMARK_MAX_LENGTH) {
          throw new Error(`备注长度应小于等于 ${REMARK_MAX_LENGTH}`);
        }
        await adminUpdateUser({
          id: user.id,
          key: AdminAllowUpdateKey.REMARK,
          value: remark,
        });
        e.emit(EventType.USER_UPDATED, {
          id: user.id,
          remark,
        });
      }

      window.setTimeout(() => onClose(), 0);
    } catch (error) {
      logger.error(error, '更新用户信息失败');
      notice.error(error.message);
    }

    setLoading(false);
  };

  return (
    <Style>
      <Style>
        <Input
          className="part"
          label="ID"
          disabled
          inputProps={{ defaultValue: user.id }}
        />
        <Input
          className="part"
          label="昵称"
          disabled
          inputProps={{ defaultValue: user.nickname }}
        />
        <Input
          className="part"
          label="邮箱"
          disabled
          inputProps={{ defaultValue: user.email }}
        />
        <Input
          className="part"
          label="加入时间"
          disabled
          inputProps={{
            defaultValue: day(user.joinTimestamp).format('YYYY-MM-DD'),
          }}
        />
        <Input
          className="part"
          label="歌单最大数量(0 表示无限制)"
          disabled={loading}
          inputProps={{
            value: musicbillMaxAmount,
            onChange: onMusicbillMacAmountChange,
          }}
        />
        <Input
          className="part"
          label="每天创建音乐最大数量(0 表示无限制)"
          disabled={loading}
          inputProps={{
            value: createMusicMaxAmountPerDay,
            onChange: onCreateMusicMaxAmountPerDayChange,
          }}
        />
        <Input
          className="part"
          label="每天导出乐单最大数量(0 表示无限制)"
          disabled={loading}
          inputProps={{
            value: exportMusicbillMaxTimePerDay,
            onChange: onExportMusicbillMaxTimePerDayChange,
          }}
        />
        <Input
          className="part"
          label="音乐播放记录保留天数(0 表示无限制)"
          disabled={loading}
          inputProps={{
            value: musicPlayRecordIndate,
            onChange: onMusicPlayRecordIndateChange,
          }}
        />
        <Textarea
          className="part"
          label="备注"
          disabled={loading}
          textareaProps={{ value: remark, onChange: onRemarkChange, rows: 5 }}
        />
        <Button
          className="part"
          variant={Variant.PRIMARY}
          onClick={onSave}
          loading={loading}
        >
          保存
        </Button>
        {user.admin ? null : (
          <Button
            className="part"
            disabled={loading}
            onClick={() =>
              dialog.confirm({
                title: '确定设为管理员吗?',
                content:
                  '成为管理员后账号将无法被删除, 以及拥有和你一样的权限且无法被撤销管理员身份',
                confirmText: '继续',
                onConfirm: () =>
                  void dialog.captcha({
                    confirmText: '设为管理员',
                    confirmVariant: Variant.PRIMARY,
                    onConfirm: async ({ captchaId, captchaValue }) => {
                      try {
                        await adminUpdateUserAdmin({
                          id: user.id,
                          captchaId,
                          captchaValue,
                        });
                        onClose();
                        e.emit(EventType.USER_UPDATED, {
                          id: user.id,
                          admin: 1,
                        });
                      } catch (error) {
                        logger.error(error, '设为管理员失败');
                        notice.error(error.message);
                        return false;
                      }
                    },
                  }),
              })
            }
          >
            设为管理员
          </Button>
        )}
        {user.admin ? null : (
          <Button
            className="part"
            variant={Variant.DANGER}
            disabled={loading}
            onClick={() =>
              dialog.confirm({
                title: '确定删除用户吗?',
                content: '用户删除后, 其创建的音乐/歌手将会转移到你的账号',
                confirmText: '继续',
                onConfirm: () =>
                  void dialog.captcha({
                    confirmText: '删除用户',
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
                        logger.error(error, '删除用户失败');
                        notice.error(error.message);
                        return false;
                      }
                    },
                  }),
              })
            }
          >
            删除用户
          </Button>
        )}
      </Style>
    </Style>
  );
}

export default UserEdit;
