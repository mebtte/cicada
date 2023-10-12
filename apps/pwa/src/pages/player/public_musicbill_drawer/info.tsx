import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { Musicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const AVATAR_SIZE = 24;
const Style = styled.div`
  position: relative;

  font-size: 0;
  user-select: none;

  > .info {
    position: absolute;
    bottom: 0;
    left: 0;
    max-width: 80%;

    padding: 10px 0 5px 0;
    background-color: rgb(255 255 255 / 0.75);

    > .name {
      margin: 0 20px;

      font-size: 22px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      ${ellipsis}
    }

    > .user {
      padding: 5px 10px;
      margin: 0 10px;

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

        font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        ${ellipsis}
      }
    }
  }
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  const { name, cover, user } = musicbill;
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
          <Cover
            src={getResizedImage({
              url: user.avatar,
              size: Math.ceil(AVATAR_SIZE * window.devicePixelRatio),
            })}
            size={AVATAR_SIZE}
            shape={Shape.CIRCLE}
          />
          <div className="nickname">{user.nickname}</div>
        </div>
      </div>
    </Style>
  );
}

export default Info;
