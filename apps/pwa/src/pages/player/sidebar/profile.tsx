import styled from 'styled-components';
import ellipsis from '@/style/ellipsis';
import { CSSVariable } from '@/global_style';
import { memo } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import { useUser } from '@/global_states/server';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/components/avatar';

const AVATAR_SIZE = 100;
const Style = styled.div`
  padding: 10px 12px 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  > .nickname {
    padding: 0 12px;
    max-width: 100%;

    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    letter-spacing: 0;
    ${ellipsis}
  }
`;

function Profile() {
  const user = useUser()!;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const profilePath = `${ROOT_PATH.PLAYER}${PLAYER_PATH.USER}`;

  return (
    <Style>
      <Avatar
        className="avatar"
        src={getResizedImage({ url: user.avatar, size: AVATAR_SIZE * 2 })}
        size={AVATAR_SIZE}
        active={pathname === profilePath}
        onClick={() => navigate(profilePath)}
      />
      <div className="nickname" title={user.nickname}>
        {user.nickname}
      </div>
    </Style>
  );
}

export default memo(Profile);
