import Popup from '@/components/popup';
import { CSSProperties, memo, useEffect, useState } from 'react';
import styled from 'styled-components';
import MenuItem from '@/components/menu_item';
import { MdImage, MdTitle, MdRemoveRedEye } from 'react-icons/md';
import p from '@/global_states/profile';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType } from '#/constants';
import updateProfile from '@/server/api/update_profile';
import { AllowUpdateKey, NICKNAME_MAX_LENGTH } from '#/constants/user';
import globalEventemitter, {
  EventType as GlobalEventType,
} from '@/platform/global_eventemitter';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
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
    padding: 10px 20px;

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

function ProfileEditPopup() {
  const profile = p.useState()!;

  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_PROFILE_EDIT_POPUP, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  const openUserDrawer = () =>
    e.emit(EventType.OPEN_USER_DRAWER, { id: profile.id });
  return (
    <Popup open={open} onClose={onClose} maskProps={maskProps}>
      <Style onClick={onClose}>
        <div className="profile" onClick={openUserDrawer}>
          <Cover src={profile.avatar} size={56} />
          <div className="info">
            <div className="primary">{profile.nickname}</div>
            <div className="secondary">ID: {profile.id}</div>
            <div className="secondary">邮箱: {profile.email}</div>
          </div>
        </div>
        <MenuItem
          label="查看个人主页"
          icon={<MdRemoveRedEye />}
          onClick={openUserDrawer}
        />
        <MenuItem
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
                  globalEventemitter.emit(GlobalEventType.RELOAD_PROFILE, null);
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
          label="修改昵称"
          icon={<MdTitle />}
          onClick={() =>
            dialog.input({
              title: '修改昵称',
              label: '昵称',
              initialValue: profile.nickname,
              maxLength: NICKNAME_MAX_LENGTH,
              onConfirm: async (nickname: string) => {
                const trimmedNickname = nickname.replace(/\s+/g, ' ').trim();
                if (!trimmedNickname) {
                  notice.error('请输入昵称');
                  return false;
                }
                if (profile.nickname !== trimmedNickname) {
                  try {
                    await updateProfile({
                      key: AllowUpdateKey.NICKNAME,
                      value: trimmedNickname,
                    });
                    globalEventemitter.emit(
                      GlobalEventType.RELOAD_PROFILE,
                      null,
                    );
                  } catch (error) {
                    logger.error(error, '更新昵称失败');
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
