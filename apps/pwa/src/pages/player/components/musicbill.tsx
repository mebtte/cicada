import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import ellipsis from '@/style/ellipsis';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  display: inline-flex;
  gap: 10px;

  padding: 8px 20px;

  cursor: pointer;
  transition: 300ms;
  user-select: none;

  > .info {
    flex: 1;
    min-width: 0;

    display: flex;
    flex-direction: column;

    > .top {
      flex: 1;
      min-height: 0;

      > .name {
        line-height: 1.5;
        font-size: 16px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        ${ellipsis};
      }

      > .music-count {
        font-size: 12px;
        color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      }
    }

    > .user {
      max-width: 100%;
      align-self: flex-start;

      display: flex;
      align-items: center;
      gap: 5px;

      cursor: pointer;

      > .nickname {
        flex: 1;
        min-width: 0;

        font-size: 14px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        ${ellipsis}
      }

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;

function Musicbill({
  id,
  cover,
  name,
  musicCount,
  user,
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  id: string;
  cover: string;
  name: string;
  musicCount: number;
  user: {
    id: string;
    nickname: string;
    avatar: string;
  };
  addon?: ReactNode;
}) {
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, {
          id,
        })
      }
      {...props}
    >
      <Cover src={cover} size={90} />
      <div className="info">
        <div className="top">
          <div className="name">{name}</div>
          <div className="music-count">{musicCount}首音乐</div>
        </div>
        <div
          className="user"
          onClick={(event) => {
            event.stopPropagation();
            return playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
              id: user.id,
            });
          }}
        >
          <Cover src={user.avatar} size={18} shape={Shape.CIRCLE} />
          <div className="nickname">{user.nickname}</div>
        </div>
        {addon}
      </div>
    </Style>
  );
}

export default Musicbill;
