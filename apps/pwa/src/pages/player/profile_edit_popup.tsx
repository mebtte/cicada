import Popup from '#/components/popup';
import { CSSProperties, memo, useEffect, useState } from 'react';
import styled from 'styled-components';
import MenuItem from '#/components/menu_item';
import { MdImage, MdTitle, MdRemoveRedEye } from 'react-icons/md';
import p from '@/global_states/profile';
import Cover from '#/components/cover';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import uploadAsset from '@/server/upload_asset';
import { AssetType } from '#/constants';
import updateProfile from '@/server/update_profile';
import { AllowUpdateKey, NICKNAME_MAX_LENGTH } from '#/constants/user';
import globalEventemitter, {
  EventType as GlobalEventType,
} from '@/platform/global_eventemitter';
import e, { EditDialogType, EventType } from './eventemitter';
import { ZIndex } from './constants';

const maskProps: {
  style: CSSProperties;
} = {
  style: {
    zIndex: ZIndex.POPUP,
  },
};
const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    maxWidth: 350,
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
    <Popup
      open={open}
      onClose={onClose}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
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
            e.emit(EventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.COVER,
              title: '修改头像',
              onSubmit: async (avatar: File | null) => {
                if (!avatar) {
                  throw new Error('请选择头像');
                }

                const { id } = await uploadAsset(avatar, AssetType.USER_AVATAR);
                await updateProfile({ key: AllowUpdateKey.AVATAR, value: id });

                globalEventemitter.emit(GlobalEventType.UPDATE_PROFILE, null);
              },
            })
          }
        />
        <MenuItem
          label="修改昵称"
          icon={<MdTitle />}
          onClick={() =>
            e.emit(EventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.INPUT,
              title: '修改昵称',
              label: '昵称',
              initialValue: profile.nickname,
              maxLength: NICKNAME_MAX_LENGTH,
              onSubmit: async (nickname: string) => {
                const trimmedNickname = nickname.replace(/\s+/g, ' ').trim();
                if (!trimmedNickname) {
                  throw new Error('请输入昵称');
                }
                if (profile.nickname !== trimmedNickname) {
                  await updateProfile({
                    key: AllowUpdateKey.NICKNAME,
                    value: trimmedNickname,
                  });

                  globalEventemitter.emit(GlobalEventType.UPDATE_PROFILE, null);
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
