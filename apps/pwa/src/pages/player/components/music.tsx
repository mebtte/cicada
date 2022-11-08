import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import {
  MdMoreHoriz,
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
} from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import Tag, { Type } from '#/components/tag';
import { MusicWithIndex } from '../constants';
import e, { EventType } from '../eventemitter';
import Singer from './singer';

const Style = styled.div`
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
  transition: 300ms;

  > .index {
    width: 35px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  > .info {
    flex: 1;
    min-width: 0;

    > .top {
      ${ellipsis}
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};

      > .name {
        font-size: 14px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      }

      > .alias {
        font-size: 12px;
      }
    }

    > .singers {
      ${ellipsis}

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
`;

function Music({
  music,
  miniMode,
}: {
  music: MusicWithIndex;
  miniMode: boolean;
}) {
  const openMusicOperatePopup = () =>
    e.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, { music });
  return (
    <Style
      onClick={() => e.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id })}
      onContextMenu={(event) => {
        event.preventDefault();
        return openMusicOperatePopup();
      }}
    >
      <div className="index">{music.index}</div>
      <div className="info">
        <div className="top">
          <span className="name">{music.name}</span>
          {music.aliases.length ? (
            <span className="alias">&nbsp;{music.aliases[0]}</span>
          ) : null}
        </div>
        <div className="singers">
          {music.singers.map((singer) => (
            <Singer key={singer.id} singer={singer} />
          ))}
        </div>
      </div>
      {music.hq ? <Tag type={Type.HQ} /> : null}
      {music.ac ? <Tag type={Type.AC} /> : null}
      <IconButton
        size={ComponentSize.SMALL}
        onClick={(event) => {
          event.stopPropagation();
          return e.emit(EventType.ACTION_PLAY_MUSIC, { music });
        }}
      >
        <MdPlayArrow />
      </IconButton>
      {miniMode ? null : (
        <>
          <IconButton
            size={ComponentSize.SMALL}
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, {
                music,
              });
            }}
          >
            <MdReadMore />
          </IconButton>
          <IconButton
            size={ComponentSize.SMALL}
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, {
                music,
              });
            }}
          >
            <MdOutlinePostAdd />
          </IconButton>
        </>
      )}
      <IconButton
        size={ComponentSize.SMALL}
        onClick={(event) => {
          event.stopPropagation();
          return openMusicOperatePopup();
        }}
      >
        <MdMoreHoriz />
      </IconButton>
    </Style>
  );
}

export default Music;
