import { CSSVariable } from '@/global_style';
import day from '#/utils/day';
import styled from 'styled-components';
import { MdAvTimer } from 'react-icons/md';
import { useContext } from 'react';
import Music from '../../../components/music';
import { MusicPlayRecord } from '../constants';
import Context from '../../../context';

const StyledMusic = styled(Music)`
  > .addon {
    margin: 0 20px;
    padding: 5px 0 10px 0;

    border-top: 1px solid ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: 12px;
    font-family: monospace;

    display: flex;
    align-items: center;
    gap: 5px;
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
          <div>{day(musicPlayRecord.timestamp).format('YYYY-MM-DD HH:mm')}</div>
          <div>|</div>
          <MdAvTimer />
          <div>{Number((musicPlayRecord.percent * 100).toFixed(2))}%</div>
        </div>
      }
    />
  );
}

export default MusicWithExternalInfo;
