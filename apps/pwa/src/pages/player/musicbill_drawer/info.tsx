import { type Ref } from 'react';
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
const USER_CARD_SHADOW = 'rgb(210 210 210)';
const Style = styled.div`
  background: #fff;
  font-size: 0;
  user-select: none;
`;
const Main = styled.div`
  position: relative;
  overflow: hidden;
`;
const CoverOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 108px 20px 18px;
  box-sizing: border-box;
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0) 0%,
    rgb(255 255 255 / 0.08) 16%,
    rgb(255 255 255 / 0.24) 32%,
    rgb(255 255 255 / 0.48) 52%,
    rgb(255 255 255 / 0.72) 70%,
    rgb(255 255 255 / 0.9) 86%,
    #fff 100%
  );
`;
const Identity = styled.section`
  > .name {
    margin: 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0;
    color: rgb(50 50 50);
    overflow-wrap: anywhere;
    -webkit-text-stroke: 0.35px rgb(255 255 255 / 0.9);
    text-shadow:
      0 1px 0 rgb(255 255 255 / 0.95),
      0 0 10px rgb(255 255 255 / 0.9);
  }

  > .user {
    width: fit-content;
    max-width: 100%;
    margin-top: 10px;
    padding: 5px 10px 5px 6px;
    box-sizing: border-box;

    display: flex;
    align-items: center;
    gap: 8px;

    background: #fff;
    border: 2px solid rgb(229 229 229);
    border-radius: 14px;
    box-shadow: 0 3px 0 ${USER_CARD_SHADOW};
    transition:
      transform 150ms ease-out,
      box-shadow 150ms ease-out,
      filter 120ms;
    cursor: pointer;

    &:hover {
      filter: brightness(1.03);
    }

    &:active {
      transform: translateY(3px);
      box-shadow: none;
      transition:
        transform 60ms ease-in,
        box-shadow 60ms ease-in,
        filter 60ms;
    }

    > .avatar {
      flex: 0 0 auto;
      padding: 2px;
      box-sizing: border-box;

      background: #fff;
      border: 2px solid rgb(229 229 229);
      border-radius: 50%;

      > * {
        display: block;
      }
    }

    > .nickname {
      flex: 1;
      min-width: 0;

      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 800;
      line-height: 1;
      color: rgb(88 88 88);
      ${ellipsis}
    }
  }
`;

function Info({
  musicbill,
  identityRef,
}: {
  musicbill: Musicbill;
  identityRef?: Ref<HTMLElement>;
}) {
  const { name, cover, user } = musicbill;
  return (
    <Style>
      <Main>
        <Cover src={cover} size="100%" shape={Shape.SQUARE} />
        <CoverOverlay>
          <Identity ref={identityRef}>
            <h1 className="name">{name}</h1>
            <div
              className="user"
              onClick={() =>
                playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
                  id: user.id,
                })
              }
            >
              <div className="avatar">
                <Cover
                  src={getResizedImage({
                    url: user.avatar,
                    size: Math.ceil(AVATAR_SIZE * window.devicePixelRatio),
                  })}
                  size={AVATAR_SIZE}
                  shape={Shape.CIRCLE}
                />
              </div>
              <div className="nickname">{user.nickname}</div>
            </div>
          </Identity>
        </CoverOverlay>
      </Main>
    </Style>
  );
}

export default Info;
