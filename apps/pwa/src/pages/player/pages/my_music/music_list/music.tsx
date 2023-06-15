import { CSSVariable } from '@/global_style';
import day from '#/utils/day';
import styled from 'styled-components';
import { MdOutlineLocalFireDepartment } from 'react-icons/md';
import { useContext } from 'react';
import Music from '../../../components/music';
import { Music as MusicType } from '../constants';
import Context from '../../../context';

const Addon = styled.div`
  padding: 5px 0 10px 0;

  border-top: 1px solid ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-family: monospace;

  display: flex;
  align-items: center;
  gap: 5px;
`;

function MusicWithExternalInfo({ music }: { music: MusicType }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return (
    <Music
      index={music.index}
      music={music}
      active={playqueue[currentPlayqueuePosition]?.id === music.id}
      addon={
        <Addon>
          <MdOutlineLocalFireDepartment />
          <div>{music.heat}</div>
          <div>|</div>
          <div>{day(music.createTimestamp).format('YYYY-MM-DD')}</div>
        </Addon>
      }
    />
  );
}

export default MusicWithExternalInfo;
