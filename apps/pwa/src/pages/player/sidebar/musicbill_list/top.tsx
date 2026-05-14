import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import Button from '@/components/button';
import {
  MdOutlineAddBox,
  MdSort,
  MdRefresh,
  MdOutlinePeopleAlt,
} from 'react-icons/md';
import { useContext } from 'react';
import { RequestStatus } from '@/constants';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import capitalize from '@/style/capitalize';
import { useTheme } from '@/global_states/theme';
import e, { EventType } from '../../eventemitter';
import Context from '../../context';
import { openCreateMusicbillDialog } from '../../utils';

const reloadMusicbillList = () =>
  e.emit(EventType.RELOAD_MUSICBILL_LIST, { silence: false });
const Style = styled.div`
  margin: 0 12px;
  min-height: 40px;
  padding: 4px 5px 5px 12px;

  display: flex;
  align-items: center;
  gap: 3px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .label {
    flex: 1;
    min-width: 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 900;
    letter-spacing: 0;
    ${capitalize}
  }
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

  return (
    <Style>
      <div className="label">{t('musicbill')}</div>
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
    </Style>
  );
}

export default Top;
