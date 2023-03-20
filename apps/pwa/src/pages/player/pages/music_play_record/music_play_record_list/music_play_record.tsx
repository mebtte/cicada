import { CSSVariable } from '@/global_style';
import day from '#/utils/day';
import styled from 'styled-components';
import { MdOutlineLocalFireDepartment } from 'react-icons/md';
import { useContext } from 'react';
import Music from '../../../components/music';
import { MusicPlayRecord } from '../constants';
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

    > .divider {
      margin: 0 6px;
    }
  }
`;

function MusicWithExternalInfo({
  musicPlayRecord,
}: {
  musicPlayRecord: MusicPlayRecord;
}) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return (
    <StyledMusic
      music={musicPlayRecord}
      active={playqueue[currentPlayqueuePosition]?.id === musicPlayRecord.id}
      addon={
        <div className="addon">
          <MdOutlineLocalFireDepartment />
          <span className="time">
            {day(musicPlayRecord.timestamp).format('YYYY-MM-DD')}
          </span>
          <span className="divider">|</span>
          <span className="percent">
            {Number((musicPlayRecord.percent * 100).toFixed(2))}%
          </span>
        </div>
      }
    />
  );
}

export default MusicWithExternalInfo;
