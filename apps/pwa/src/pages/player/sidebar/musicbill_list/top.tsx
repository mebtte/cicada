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
import { useNavigate } from 'react-router-dom';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import capitalize from '@/style/capitalize';
import e, { EventType } from '../../eventemitter';
import Context from '../../context';
import { openCreateMusicbillDialog } from '../../utils';

const reloadMusicbillList = () =>
  e.emit(EventType.RELOAD_MUSICBILL_LIST, { silence: false });
const Style = styled.div`
  margin: 0 20px;

  display: flex;
  align-items: center;
  gap: 2px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .label {
    flex: 1;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    ${capitalize}
  }
`;

function Top() {
  const navigate = useNavigate();
  const { getMusicbillListStatus, musicbillList } = useContext(Context);
  return (
    <Style>
      <div className="label">{t('musicbill')}</div>
      <Button
        square
        variant="plain"
        size="sm"
        onClick={reloadMusicbillList}
        loading={getMusicbillListStatus === RequestStatus.LOADING}
      >
        <MdRefresh />
      </Button>
      <Button
        square
        variant="plain"
        size="sm"
        onClick={openCreateMusicbillDialog}
      >
        <MdOutlineAddBox />
      </Button>
      <Button
        square
        variant="plain"
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
      </Button>
      <Button
        square
        variant="plain"
        size="sm"
        onClick={() =>
          navigate(ROOT_PATH.PLAYER + PLAYER_PATH.SHARED_MUSICBILL_INVITATION)
        }
      >
        <MdOutlinePeopleAlt />
      </Button>
    </Style>
  );
}

export default Top;
