import { memo, useContext } from 'react';
import styled from 'styled-components';
import p from '@/global_states/profile';
import Page from '../page';
import Context from '../../context';
import PlayMode from './play_mode';
import Volume from './volume';
import Logout from './logout';
import Admin from './admin';

const Style = styled(Page)`
  overflow: auto;
`;

function Setting() {
  const profile = p.useState()!;
  const { playMode } = useContext(Context);
  return (
    <Style>
      <PlayMode playMode={playMode} />
      <Volume />
      {profile.admin ? <Admin /> : null}
      <Logout />
    </Style>
  );
}

export default memo(Setting);
