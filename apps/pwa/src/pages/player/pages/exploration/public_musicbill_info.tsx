import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import { PublicMusicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

const Style = styled.div`
  > .name {
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }
  > .user {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}

    &:hover {
      text-decoration: underline;
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
