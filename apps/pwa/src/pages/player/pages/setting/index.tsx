import { memo } from 'react';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import Page from '../page';
import Volume from './volume';
import Language from './language';
import AdminQuickEdit from './admin_quick_edit';
import OfflineCache from './offline_cache';
import Feedback from './feedback';
import PlaybackQuality from './playback_quality';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../constants';

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
  overflow: auto;
  ${autoScrollbar}

  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;

function Setting() {
  return (
    <Style>
      {AUDIO_VOLUME_SETABLE ? <Volume /> : null}
      <PlaybackQuality />
      <Language />
      <AdminQuickEdit />
      <OfflineCache />
      <Feedback />
    </Style>
  );
}

export default memo(Setting);
