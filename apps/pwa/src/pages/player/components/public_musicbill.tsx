import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import { HtmlHTMLAttributes } from 'react';
import ellipsis from '@/style/ellipsis';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  font-size: 0;

  > .cover-box {
    cursor: pointer;
  }

  > .name {
    margin-top: 5px;

    ${ellipsis}
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    cursor: pointer;
  }

  > .nickname {
    flex: 1;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}

    > span {
      cursor: pointer;

      &:hover {
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      }
    }
  }
`;

function PublicMusicbill({
  id,
  cover,
  name,
  userId,
  userNickname,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  id: string;
  cover: string;
  name: string;
  userId: string;
  userNickname: string;
}) {
  const openMusicbillDrawer = () =>
    playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, {
      id,
    });
  return (
    <Style {...props}>
      <div className="cover-box" onClick={openMusicbillDrawer}>
        <Cover src={cover} size="100%" />
      </div>
      <div className="name" onClick={openMusicbillDrawer}>
        {name}
      </div>
      <div className="nickname">
        <span
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
              id: userId,
            })
          }
        >
          {userNickname}
        </span>
      </div>
    </Style>
  );
}

export default PublicMusicbill;
