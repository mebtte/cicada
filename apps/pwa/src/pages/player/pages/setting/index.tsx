import { memo } from 'react';
import styled from 'styled-components';
import p from '@/global_states/profile';
import autoScrollbar from '@/style/auto_scrollbar';
import Page from '../page';
import Logout from './logout';
import UserManage from './user_manage';
import { HEADER_HEIGHT } from '../../constants';
import Volume from './volume';
import ExtraInfo from './extra_info';
import Language from './language';

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
  ${autoScrollbar}
`;

function Setting() {
  const profile = p.useState()!;
  return (
    <Style>
      {AUDIO_VOLUME_SETABLE ? <Volume /> : null}
      <Language />
      {profile.admin ? <UserManage /> : null}
      <Logout />
      <ExtraInfo />
    </Style>
  );
}

export default memo(Setting);
