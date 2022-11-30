import { memo, useContext } from 'react';
import styled from 'styled-components';
import p from '@/global_states/profile';
import Page from '../page';
import Context from '../../context';
import PlayMode from './play_mode';
import Volume from './volume';
import Logout from './logout';
import UserManage from './user_manage';
import { HEADER_HEIGHT } from '../../constants';

const AUDIO_VOLUME_SETABLE = await (() =>
  Promise.race([
    new Promise<boolean>((resolve) => {
      const audio = document.createElement('audio');
      audio.addEventListener('volumechange', () => resolve(true));
      audio.volume = 0.5;
    }),
    new Promise<boolean>((resolve) =>
      window.setTimeout(() => resolve(false), 500),
    ),
  ]))();
const Style = styled(Page)`
  padding-top: ${HEADER_HEIGHT}px;

  overflow: auto;
`;

function Setting() {
  const profile = p.useState()!;
  const { playMode } = useContext(Context);
  return (
    <Style>
      <PlayMode playMode={playMode} />
      {AUDIO_VOLUME_SETABLE ? <Volume /> : null}
      {profile.admin ? <UserManage /> : null}
      <Logout />
    </Style>
  );
}

export default memo(Setting);
