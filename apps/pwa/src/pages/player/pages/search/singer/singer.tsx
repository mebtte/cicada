import styled, { css } from 'styled-components';
import Cover from '#/components/cover';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import { Singer as SingerType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const Style = styled.div`
  display: inline-flex;
  gap: 10px;

  padding: 8px 20px;

  cursor: pointer;
  transition: 300ms;

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
        font-size: 14px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        ${ellipsis};
      }

      > .alias {
        font-size: 12px;
        color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        ${ellipsis};
      }
    }

    > .music-count {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }

  ${({ theme: { miniMode } }) => css`
    width: ${miniMode ? '100%' : '50%'};
  `}
`;

function Singer({ singer }: { singer: SingerType }) {
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, {
          id: singer.id,
        })
      }
    >
      <Cover src={singer.avatar} size={64} />
      <div className="info">
        <div className="top">
          <div className="name">{singer.name}</div>
          {singer.aliases.length ? (
            <div className="alias">{singer.aliases[0]}</div>
          ) : null}
        </div>
        <div className="music-count">{singer.musicCount}首音乐</div>
      </div>
    </Style>
  );
}

export default Singer;
