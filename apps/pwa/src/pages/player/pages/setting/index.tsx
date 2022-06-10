import { memo, useContext } from 'react';
import styled from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Context from '../../context';
import PlayMode from './play_mode';
import Volume from './volume';

const Style = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  ${scrollbarAsNeeded}
`;

function Setting() {
  const { playMode } = useContext(Context);
  return (
    <Style>
      <PlayMode playMode={playMode} />
      <Volume />
    </Style>
  );
}

export default memo(Setting);
