import { memo } from 'react';
import styled from 'styled-components';
import AppExtraInfo from '@/components/app_extra_info';
import autoScrollbar from '@/style/auto_scrollbar';
import Page, { PAGE_HORIZONTAL_PADDING } from '../page';
import Language from './language';
import AdminQuickEdit from './admin_quick_edit';
import OfflineCache from './offline_cache';
import Feedback from './feedback';
import PlaybackQuality from './playback_quality';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../constants';

const Style = styled(Page)`
  overflow: auto;
  ${autoScrollbar}

  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;
const extraInfoStyle = {
  margin: `20px ${PAGE_HORIZONTAL_PADDING}`,
};

function Setting() {
  return (
    <Style>
      <PlaybackQuality />
      <Language />
      <AdminQuickEdit />
      <OfflineCache />
      <Feedback />
      <AppExtraInfo style={extraInfoStyle} />
    </Style>
  );
}

export default memo(Setting);
