import styled from 'styled-components';
import p from '@/global_states/profile';
import Cover, { Shape } from '@/components/cover';
import ellipsis from '@/style/ellipsis';
import { CSSVariable } from '@/global_style';
import { memo } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import e, { EventType } from '../eventemitter';

const AVATAR_SIZE = 100;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;

  > .avatar {
    cursor: pointer;
    outline: 1px solid ${CSSVariable.COLOR_PRIMARY};
    transition: 300ms;

    &:hover {
      outline-width: 3px;
    }
  }

  > .nickname {
    padding: 0 30px;
    max-width: 100%;

    font-size: 14px;
    ${ellipsis}
  }
`;
const openProfileEditPopup = () =>
  e.emit(EventType.OPEN_PROFILE_EDIT_POPUP, null);

function Profile() {
  const profile = p.useState()!;
  return (
    <Style>
      <Cover
        className="avatar"
        src={getResizedImage({ url: profile.avatar, size: AVATAR_SIZE * 2 })}
        size={AVATAR_SIZE}
        shape={Shape.CIRCLE}
        onClick={openProfileEditPopup}
      />
      <div className="nickname" title={profile.nickname}>
        {profile.nickname}
      </div>
    </Style>
  );
}

export default memo(Profile);
