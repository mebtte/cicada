import Popup from '@/components/popup';
import { CSSProperties, memo, useEffect, useState } from 'react';
import styled from 'styled-components';
import MenuItem from '@/components/menu_item';
import { MdImage, MdTitle } from 'react-icons/md';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType } from '#/constants';
import updateProfile from '@/server/api/update_profile';
import { AllowUpdateKey, NICKNAME_MAX_LENGTH } from '#/constants/user';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import { reloadUser, useUser } from '@/global_states/server';
import { ZIndex } from './constants';
import e, { EventType } from './eventemitter';

const maskProps: {
  style: CSSProperties;
} = {
  style: {
    zIndex: ZIndex.POPUP,
  },
};
const Style = styled.div`
  padding: 10px 0 max(env(safe-area-inset-bottom, 10px), 10px) 0;

  > .profile {
    padding: 10px;
    margin: 0 10px;

    display: flex;
    align-items: center;
    gap: 10px;

    cursor: pointer;
    transition: 300ms;

    > .info {
      flex: 1;
      min-width: 0;

      > .primary {
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        font-size: 14px;
        ${ellipsis}
      }

      > .secondary {
        color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        font-size: 12px;
        ${ellipsis}
      }
    }

    &:hover {
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
    }

    &:active {
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
    }
  }
`;
const itemStyle: CSSProperties = { margin: '0 10px' };

function ProfileEditPopup() {
  const user = useUser()!;

  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_PROFILE_EDIT_POPUP, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  const openUserDrawer = () =>
    e.emit(EventType.OPEN_USER_DRAWER, { id: user.id });
  return (
    <Popup open={open} onClose={onClose} maskProps={maskProps}>
      <Style onClick={onClose}>
        <div className="profile" onClick={openUserDrawer}>
          <Cover src={user.avatar} size={56} />
          <div className="info">
            <div className="primary">{user.nickname}</div>
            <div className="secondary">用户名: {user.username}</div>
          </div>
        </div>
        <MenuItem
          style={itemStyle}
          label="修改头像"
          icon={<MdImage />}
          onClick={() =>
            dialog.imageCut({
              title: '修改头像',
              onConfirm: async (avatar) => {
                if (!avatar) {
                  notice.error('请选择头像');
                  return false;
                }
                try {
                  const { id } = await uploadAsset(
                    avatar,
                    AssetType.USER_AVATAR,
                  );
                  await updateProfile({
                    key: AllowUpdateKey.AVATAR,
                    value: id,
                  });
                  await reloadUser();
                } catch (error) {
                  logger.error(error, "Updating profile's avatar fail");
                  notice.error(error.message);
                  return false;
                }
              },
            })
          }
        />
        <MenuItem
          style={itemStyle}
          label="修改昵称"
          icon={<MdTitle />}
          onClick={() =>
            dialog.input({
              title: '修改昵称',
              label: '昵称',
              initialValue: user.nickname,
              maxLength: NICKNAME_MAX_LENGTH,
              onConfirm: async (nickname: string) => {
                const trimmedNickname = nickname.replace(/\s+/g, ' ').trim();
                if (!trimmedNickname) {
                  notice.error('请输入昵称');
                  return false;
                }
                if (user.nickname !== trimmedNickname) {
                  try {
                    await updateProfile({
                      key: AllowUpdateKey.NICKNAME,
                      value: trimmedNickname,
                    });
                    await reloadUser();
                  } catch (error) {
                    logger.error(error, 'Failed to update nickname');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
      </Style>
    </Popup>
  );
}

export default memo(ProfileEditPopup);
