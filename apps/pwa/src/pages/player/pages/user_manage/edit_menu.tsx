import Popup from '@/components/popup';
import { CSSProperties, useEffect, useState } from 'react';
import MenuItem from '@/components/menu_item';
import { MdTitle, MdPersonOutline, MdDeleteOutline } from 'react-icons/md';
import styled from 'styled-components';
import adminUpdateUser from '@/server/admin_update_user';
import adminDeleteUser from '@/server/admin_delete_user';
import { AdminAllowUpdateKey } from '#/constants/user';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import { EMAIL } from '#/constants/regexp';
import logger from '#/utils/logger';
import { CSSVariable } from '@/global_style';
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
const deleteIconStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

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
        {user?.admin ? null : (
          <MenuItem
            icon={<MdPersonOutline />}
            label="设为管理员"
            onClick={() =>
              dialog.confirm({
                title: '确定将用户设为管理员吗?',
                content:
                  '用户成为管理员后将无法被删除, 以及将拥有和你一样的权限且无法被撤销管理员身份',
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
        {user?.admin ? null : (
          <MenuItem
            icon={<MdDeleteOutline style={deleteIconStyle} />}
            label="删除用户"
            onClick={() =>
              dialog.confirm({
                title: '确定删除用户吗?',
                content: '用户相关的音乐/乐单等相关资源也会一并被删除',
                confirmText: '继续',
                onConfirm: () =>
                  void dialog.confirm({
                    title: '确定删除用户吗?',
                    content: '这是第二次确认, 也是最后一次确认',
                    onConfirm: async () => {
                      try {
                        await adminDeleteUser(user!.id);
                        e.emit(EventType.RELOAD_DATA, null);
                      } catch (error) {
                        logger.error(error, '删除用户失败');
                        dialog.alert({
                          title: '删除用户失败',
                          content: error.message,
                        });
                      }
                    },
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
