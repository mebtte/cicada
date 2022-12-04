import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import day from '#/utils/day';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { Musicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  position: relative;

  user-select: none;

  > .info {
    position: absolute;
    bottom: 0;
    left: 0;
    max-width: 90%;

    padding: 10px 0;
    background-color: rgb(255 255 255 / 0.75);

    > .name {
      margin: 0 20px;

      font-size: 22px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      ${ellipsis}
    }

    > .user {
      margin: 5px 0;
      padding: 5px 20px;

      display: flex;
      align-items: center;
      gap: 10px;

      transition: 300ms;
      cursor: pointer;

      &:hover {
        background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
      }

      &:active {
        background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
      }

      > .nickname {
        flex: 1;
        min-width: 0;

        font-size: 14px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        ${ellipsis}
      }
    }

    > .time {
      margin: 0 20px;

      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  const { name, cover, createTimestamp, user } = musicbill;
  return (
    <Style>
      <Cover src={cover} size="100%" />
      <div className="info">
        <div className="name">{name}</div>
        <div
          className="user"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
              id: user.id,
            })
          }
        >
          <Cover src={user.avatar} size={28} shape={Shape.CIRCLE} />
          <div className="nickname">{user.nickname}</div>
        </div>
        <div className="time">
          创建于 {day(createTimestamp).format('YYYY-MM-DD')}
        </div>
      </div>
    </Style>
  );
}

export default Info;
