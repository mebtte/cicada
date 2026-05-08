import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import { PublicMusicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

const Style = styled.div`
  > .name {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 900;
    line-height: 1.3;
    ${ellipsis}
  }
  > .user {
    margin-top: 2px;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    line-height: 1.35;
    cursor: pointer;
    transition: color 120ms ease-out;
    ${ellipsis}

    &:hover {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }
  }
`;

function PublicMusicbillInfo({
  publicMusicbill,
}: {
  publicMusicbill: PublicMusicbill;
}) {
  return (
    <Style>
      <div className="name">{publicMusicbill.name}</div>
      <div
        className="user"
        onClick={(event) => {
          event.stopPropagation();
          return playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
            id: publicMusicbill.user.id,
          });
        }}
      >
        {publicMusicbill.user.nickname}
      </div>
    </Style>
  );
}

export default PublicMusicbillInfo;
