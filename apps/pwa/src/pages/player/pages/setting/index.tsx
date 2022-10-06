import { memo, useContext } from 'react';
import styled from 'styled-components';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Page from '../page';
import Context from '../../context';
import PlayMode from './play_mode';
import Volume from './volume';

const Style = styled(Page)`
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
