import styled from 'styled-components';
import p from '@/global_states/profile';
import Cover, { Shape } from '@/components/cover';
import ellipsis from '@/style/ellipsis';
import { CSSVariable } from '@/global_style';
import { memo } from 'react';
import e, { EventType } from '../eventemitter';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;

  > .avatar {
    cursor: pointer;
    border: 2px solid transparent;
    transition: 300ms;

    &:hover {
      border-color: ${CSSVariable.COLOR_PRIMARY};
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
        src={profile.avatar}
        size={100}
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
