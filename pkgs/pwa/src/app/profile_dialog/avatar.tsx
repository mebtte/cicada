import React, { useState } from 'react';
import styled from 'styled-components';

import store from '@/store';
import { reloadUser } from '@/store/user';
import updateUser, { Key } from '@/server/update_user';
import ImageCutterDialog from '@/components/image_cutter_dialog';
import IconButton, { Name } from '@/components/icon_button';
import Avatar from '@/components/avatar';
import { User, AVATAR_MAX_SIZE } from '@/constants/user';
import { PART_SPACE } from './constants';

const avatarSize = {
  width: AVATAR_MAX_SIZE,
  height: AVATAR_MAX_SIZE,
};
const Style = styled.div`
  margin-bottom: ${PART_SPACE}px;
  display: flex;
  align-items: center;
  gap: 20px;
  > .avatar {
    border: 1px solid var(--color-primary);
  }
`;

const Wrapper = ({ user }: { user: User }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const onUpdateAvatar = async (file: File) => {
    await updateUser({ key: Key.AVATAR, value: file });
    // @ts-expect-error
    return store.dispatch(reloadUser());
  };
  return (
    <Style>
      <Avatar className="avatar" src={user.avatar} size={100} animated />
      <IconButton
        name={Name.EDIT_OUTLINE}
        onClick={() => setEditDialogOpen(true)}
      />
      <ImageCutterDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        imageSize={avatarSize}
        onUpdate={onUpdateAvatar}
      />
    </Style>
  );
};

export default Wrapper;
