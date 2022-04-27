import React, { useContext } from 'react';
import styled from 'styled-components';

import electron from '@/platform/electron';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Context from '../../context';
import PlayMode from './play_mode';
import GlobalShortcut from './global_shortcut';
import Volume from './volume';
import Feedback from './feedback';

const Style = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  ${scrollbarAsNeeded}
`;

const Setting = () => {
  const { playMode, volume } = useContext(Context);
  return (
    <Style>
      <PlayMode playMode={playMode} />
      <Volume volume={volume} />
      {electron ? <GlobalShortcut /> : null}
      <Feedback />
    </Style>
  );
};

export default React.memo(Setting);
