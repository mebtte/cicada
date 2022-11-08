import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import day from '#/utils/day';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdPlayArrow, MdMoreHoriz } from 'react-icons/md';
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
const Primary = styled.div`
  font-size: 14px;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};

  ${ellipsis}

  &.heat {
    font-family: monospace;
  }
`;
const Secondary = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  ${ellipsis}

  &.time {
    font-family: monospace;
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
      one={<Secondary>{music.index}</Secondary>}
      two={
        <div>
          <Primary>{music.name}</Primary>
          {music.aliases.length ? (
            <Secondary>
              {music.aliases[0]}
              {music.aliases.length > 1 ? '...' : ''}
            </Secondary>
          ) : null}
        </div>
      }
      three={
        <Secondary>
          {music.singers.map((singer) => (
            <Singer key={singer.id} singer={singer} />
          ))}
        </Secondary>
      }
      four={<Primary className="heat">{music.heat}</Primary>}
      five={
        <Secondary className="time">
          {day(music.createTimestamp).format('YYYY-MM-DD')}
        </Secondary>
      }
      six={
        <Operation>
          {miniMode ? null : (
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
