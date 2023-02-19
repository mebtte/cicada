import Popup from '@/components/popup';
import { CSSProperties, useEffect, useState } from 'react';
import MenuItem from '@/components/menu_item';
import { MdTitle, MdPersonOutline } from 'react-icons/md';
import styled from 'styled-components';
import adminUpdateUser from '@/server/admin_update_user';
import { AdminAllowUpdateKey } from '#/constants/user';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import { EMAIL } from '#/constants/regexp';
import { ZIndex } from '../../constants';
import { User } from './constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../../eventemitter';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.POPUP,
  },
};
const bodyProps: {
  style: CSSProperties;
} = {
  style: { width: 250 },
};
const Style = styled.div`
  padding: 10px 0 max(env(safe-area-inset-bottom, 10px), 10px) 0;
`;

function EditMenu() {
  const [user, setUser] = useState<User | null>(null);
  const onClose = () => setUser(null);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_MENU, (data) =>
      setUser(data.user),
    );
    return unlistenOpen;
  }, []);

  return (
    <Popup
      open={!!user}
      onClose={onClose}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
      <Style onClick={onClose}>
        <MenuItem
          icon={<MdTitle />}
          label="修改邮箱"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.INPUT,
              label: '备注',
              title: '修改邮箱',
              initialValue: user?.email,
              onSubmit: async (email: string) => {
                if (email !== user?.email) {
                  if (!email || !EMAIL.test(email)) {
                    throw new Error('邮箱格式错误');
                  }

                  await adminUpdateUser({
                    id: user!.id,
                    key: AdminAllowUpdateKey.EMAIL,
                    value: email,
                  });
                  e.emit(EventType.RELOAD_DATA, null);
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdTitle />}
          label="修改备注"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.INPUT,
              label: '备注',
              title: '修改备注',
              initialValue: user?.remark,
              onSubmit: async (remark: string) => {
                if (remark !== user?.remark) {
                  await adminUpdateUser({
                    id: user!.id,
                    key: AdminAllowUpdateKey.REMARK,
                    value: remark,
                  });
                  e.emit(EventType.RELOAD_DATA, null);
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdTitle />}
          label="修改乐单最大数量"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.INPUT,
              label: '乐单最大数量',
              title: '修改乐单最大数量',
              initialValue: user?.musicbillMaxAmount.toString(),
              inputType: 'number',
              placeholder: '0 表示无限制',
              onSubmit: async (musicbillMaxAmount: string) => {
                const musicbillMaxAmountNumber = Number(musicbillMaxAmount);
                if (musicbillMaxAmountNumber < 0) {
                  throw new Error('值请大于 0');
                }
                if (user?.musicbillMaxAmount !== musicbillMaxAmountNumber) {
                  await adminUpdateUser({
                    id: user!.id,
                    key: AdminAllowUpdateKey.MUSICBILL_MAX_AMOUNT,
                    value: musicbillMaxAmountNumber,
                  });
                  e.emit(EventType.RELOAD_DATA, null);
                }
              },
            })
          }
        />
        {user?.admin ? null : (
          <MenuItem
            icon={<MdPersonOutline />}
            label="设为管理员"
            onClick={() =>
              dialog.confirm({
                title: '确定将用户设为管理员吗?',
                content:
                  '用户成为管理员后将拥有和你一样的权限, 且无法被撤销管理员身份',
                confirmText: '继续',
                onConfirm: () =>
                  void dialog.confirm({
                    title: '确定将用户设为管理员吗?',
                    content: '这是第二次确认, 也是最后一次确认',
                    onConfirm: () =>
                      adminUpdateUser({
                        id: user!.id,
                        key: AdminAllowUpdateKey.ADMIN,
                        value: null,
                      })
                        .then(() => e.emit(EventType.RELOAD_DATA, null))
                        .catch((error) => void notice.error(error.message)),
                  }),
              })
            }
          />
        )}
      </Style>
    </Popup>
  );
}

export default EditMenu;
