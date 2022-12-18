import { CSSVariable } from '@/global_style';
import day from '#/utils/day';
import styled from 'styled-components';
import { MdOutlineLocalFireDepartment } from 'react-icons/md';
import { useContext } from 'react';
import Music from '../../../components/music';
import { Music as MusicType } from '../constants';
import Context from '../../../context';

const StyledMusic = styled(Music)`
  > .addon {
    margin: 0 20px 0 65px;
    padding: 5px 0 10px 0;

    border-top: 1px solid ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: 12px;
    font-family: monospace;

    > * {
      vertical-align: middle;
    }

    > .heat {
      margin-left: 2px;
    }

    > .divider {
      margin: 0 6px;
    }
  }
`;

function MusicWithExternalInfo({ music }: { music: MusicType }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return (
    <StyledMusic
      music={music}
      active={playqueue[currentPlayqueuePosition]?.id === music.id}
      addon={
        <div className="addon">
          <MdOutlineLocalFireDepartment />
          <span className="heat">{music.heat}</span>
          <span className="divider">|</span>
          <span className="create-time">
            {day(music.createTimestamp).format('YYYY-MM-DD')}
          </span>
        </div>
      }
    />
  );
}

export default MusicWithExternalInfo;
