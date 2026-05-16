import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import Button from '@/components/button';
import {
  MdOutlineAddBox,
  MdSort,
  MdRefresh,
  MdOutlinePeopleAlt,
  MdStarOutline,
} from 'react-icons/md';
import { useContext } from 'react';
import { RequestStatus } from '@/constants';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { useTheme } from '@/global_states/theme';
import e, { EventType } from '../../eventemitter';
import Context from '../../context';
import { openCreateMusicbillDialog } from '../../utils';

const reloadMusicbillList = () =>
  e.emit(EventType.RELOAD_MUSICBILL_LIST, { silence: false });
const OPEN_DRAWER_AFTER_CLOSE_FRAME_COUNT = 2;

function runAfterAnimationFrames(callback: () => void, frameCount: number) {
  let currentFrame = 0;

  const run = () => {
    currentFrame += 1;

    if (currentFrame >= frameCount) {
      callback();
      return;
    }

    window.requestAnimationFrame(run);
  };

  window.requestAnimationFrame(run);
}

const Style = styled.div`
  margin: 0 12px;
  min-height: 40px;
  padding: 4px 5px 5px 12px;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;
const ToolButton = styled(Button)`
  && {
    flex: 0 0 auto;
    width: 30px;
    height: 30px;

    border-radius: 10px;
    font-size: 18px;
  }
`;

function Top() {
  const { miniMode } = useTheme();
  const { getMusicbillListStatus, musicbillList } = useContext(Context);
  const openSharedMusicbillInvitationDrawer = () => {
    if (miniMode) {
      e.emit(EventType.MINI_MODE_CLOSE_SIDEBAR, null);
      window.requestAnimationFrame(() =>
        e.emit(EventType.OPEN_SHARED_MUSICBILL_INVITATION_DRAWER, null),
      );
      return;
    }
    e.emit(EventType.OPEN_SHARED_MUSICBILL_INVITATION_DRAWER, null);
  };
  const openPublicMusicbillCollectionDrawer = () => {
    if (!miniMode) {
      e.emit(EventType.OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER, null);
      return;
    }

    e.emit(EventType.MINI_MODE_CLOSE_SIDEBAR, null);
    // 先等窄屏侧栏关闭，再打开收藏抽屉，避免两个 drawer 叠加后关闭按钮不可达。
    runAfterAnimationFrames(
      () => e.emit(EventType.OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER, null),
      OPEN_DRAWER_AFTER_CLOSE_FRAME_COUNT,
    );
  };

  return (
    <Style aria-label={t('musicbill')}>
      <ToolButton
        square
        variant="ghost"
        size="sm"
        onClick={reloadMusicbillList}
        loading={getMusicbillListStatus === RequestStatus.LOADING}
      >
        <MdRefresh />
      </ToolButton>
      <ToolButton
        square
        variant="primary"
        size="sm"
        onClick={openCreateMusicbillDialog}
      >
        <MdOutlineAddBox />
      </ToolButton>
      <ToolButton
        square
        variant="ghost"
        size="sm"
        disabled={getMusicbillListStatus !== RequestStatus.SUCCESS}
        onClick={() => {
          if (musicbillList.length) {
            return e.emit(EventType.OPEN_MUSICBILL_ORDER_DRAWER, null);
          }
          return notice.info(t('no_musicbill'));
        }}
      >
        <MdSort />
      </ToolButton>
      <ToolButton
        square
        variant="ghost"
        size="sm"
        onClick={openSharedMusicbillInvitationDrawer}
      >
        <MdOutlinePeopleAlt />
      </ToolButton>
      <ToolButton
        square
        variant="ghost"
        size="sm"
        aria-label={t('public_musicbill_collection')}
        title={t('public_musicbill_collection')}
        onClick={openPublicMusicbillCollectionDrawer}
      >
        <MdStarOutline />
      </ToolButton>
    </Style>
  );
}

export default Top;
