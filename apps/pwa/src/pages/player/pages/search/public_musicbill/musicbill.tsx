import styled from 'styled-components';
import Cover from '@/components/cover';
import { Shape } from '@/components/cover/constants';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { t } from '@/i18n';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const ACCENT = 'rgb(255 184 28)';
const SURFACE_BORDER = CSSVariable.COLOR_BORDER;
const SURFACE_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

const Style = styled.button`
  width: 100%;
  min-width: 0;
  min-height: 76px;
  padding: 0 16px 4px;

  display: flex;
  align-items: center;
  gap: 14px;

  border: 2px solid ${SURFACE_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 0 ${SURFACE_SHADOW};
  color: inherit;
  appearance: none;
  cursor: pointer;
  margin: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  text-align: left;

  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out;

  > .cover-frame {
    flex: 0 0 64px;
    width: 64px;
    height: 50px;

    border: 3px solid ${SURFACE_BORDER};
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 3px 0 ${SURFACE_SHADOW};
  }

  > .cover-frame > .cover {
    width: 100%;
    height: 100%;
  }

  > .info {
    flex: 1;
    min-width: 0;
  }

  > .info > .name {
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 900;
    line-height: 1.3;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .info > .owner {
    margin-top: 3px;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }

  > .count {
    flex: 0 0 58px;
    min-width: 58px;
    padding-left: 14px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    border-left: 2px solid ${SURFACE_BORDER};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    line-height: 1.05;
  }

  > .count > .value {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 900;
  }

  > .count > .label {
    margin-top: 3px;

    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    text-transform: capitalize;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${SURFACE_SHADOW};
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in;
  }

  &:focus-visible {
    outline: 3px solid ${ACCENT};
    outline-offset: 3px;
  }

  @media (max-width: 420px) {
    min-height: 68px;
    padding-inline: 12px;
    gap: 10px;

    > .cover-frame {
      flex-basis: 56px;
      width: 56px;
      height: 46px;
    }

    > .count {
      flex-basis: 48px;
      min-width: 48px;
      padding-left: 10px;
    }
  }
`;

function Musicbill({
  id,
  cover,
  name,
  userNickname,
  musicCount,
}: {
  id: string;
  cover: string;
  name: string;
  userNickname: string;
  musicCount?: number;
}) {
  const normalizedMusicCount = musicCount ?? 0;
  const musicCountText = t('music_count', normalizedMusicCount.toString());

  return (
    <Style
      type="button"
      aria-label={name}
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, {
          id,
        })
      }
    >
      <div className="cover-frame">
        <Cover
          className="cover"
          shape={Shape.ROUNDED}
          src={cover}
          size="100%"
        />
      </div>
      <div className="info">
        <div className="name">{name}</div>
        <div className="owner">{userNickname}</div>
      </div>
      <div className="count" aria-label={musicCountText}>
        <span className="value">{normalizedMusicCount}</span>
        <span className="label">{t('music')}</span>
      </div>
    </Style>
  );
}

export default Musicbill;
