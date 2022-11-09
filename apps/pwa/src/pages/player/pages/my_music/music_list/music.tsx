import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import {
  MdPlayArrow,
  MdMoreHoriz,
  MdReadMore,
  MdOutlinePostAdd,
} from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import mm from '@/global_states/mini_mode';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { Music as MusicType } from '../constants';
import Row from './row';
import Singer from '../../../components/singer';

const Style = styled(Row)`
  cursor: pointer;
  transition: 300ms;

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }
`;
const Index = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-family: monospace;
`;
const Heat = styled.div`
  font-size: 14px;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-family: monospace;
`;
const Info = styled.div`
  > .top {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}

    > .name {
      font-size: 14px;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .alias {
      font-size: 12px;
    }
  }

  > .singers {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }
`;
const Operation = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
`;

function Music({ music }: { music: MusicType }) {
  const miniMode = mm.useState();

  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
          id: music.id,
        })
      }
      onContextMenu={(e) => {
        e.preventDefault();
        return playerEventemitter.emit(
          PlayerEventType.OPEN_MUSIC_OPERATE_POPUP,
          { music },
        );
      }}
      one={<Index>{music.index}</Index>}
      two={
        <Info>
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
        </Info>
      }
      three={<Heat>{music.heat}</Heat>}
      four={
        <Operation>
          <IconButton
            size={ComponentSize.SMALL}
            onClick={(event) => {
              event.stopPropagation();
              return playerEventemitter.emit(
                PlayerEventType.ACTION_PLAY_MUSIC,
                { music },
              );
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
                  return playerEventemitter.emit(
                    PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
                    { music },
                  );
                }}
              >
                <MdReadMore />
              </IconButton>
              <IconButton
                size={ComponentSize.SMALL}
                onClick={(event) => {
                  event.stopPropagation();
                  return playerEventemitter.emit(
                    PlayerEventType.OPEN_MUSICBILL_LIST_DRAWER,
                    { music },
                  );
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
              return playerEventemitter.emit(
                PlayerEventType.OPEN_MUSIC_OPERATE_POPUP,
                { music },
              );
            }}
          >
            <MdMoreHoriz />
          </IconButton>
        </Operation>
      }
    />
  );
}

export default Music;
