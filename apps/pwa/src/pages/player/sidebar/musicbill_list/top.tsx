import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd, MdSort, MdRefresh, MdStarOutline } from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import { useContext } from 'react';
import { RequestStatus } from '@/constants';
import notice from '#/utils/notice';
import { useNavigate } from 'react-router-dom';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import e, { EventType } from '../../eventemitter';
import Context from '../../context';
import { openCreateMusicbillDialog } from '../../utils';

const reloadMusicbillList = () => e.emit(EventType.RELOAD_MUSICBILL_LIST, null);
const Style = styled.div`
  margin: 0 20px;

  display: flex;
  align-items: center;
  gap: 2px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .label {
    flex: 1;
    min-width: 0;

    font-size: 12px;
  }
`;

function Top() {
  const navigate = useNavigate();
  const { getMusicbillListStatus, musicbillList } = useContext(Context);
  return (
    <Style>
      <div className="label">乐单</div>
      <IconButton
        size={ComponentSize.SMALL}
        onClick={reloadMusicbillList}
        loading={getMusicbillListStatus === RequestStatus.LOADING}
      >
        <MdRefresh />
      </IconButton>
      <IconButton
        size={ComponentSize.SMALL}
        onClick={openCreateMusicbillDialog}
      >
        <MdAdd />
      </IconButton>
      <IconButton
        size={ComponentSize.SMALL}
        disabled={getMusicbillListStatus !== RequestStatus.SUCCESS}
        onClick={() => {
          if (musicbillList.length) {
            return e.emit(EventType.OPEN_MUSICBILL_ORDER_DRAWER, null);
          }
          return notice.info('暂无歌单可以排序');
        }}
      >
        <MdSort />
      </IconButton>
      <IconButton
        size={ComponentSize.SMALL}
        onClick={() =>
          navigate(ROOT_PATH.PLAYER + PLAYER_PATH.MUSICBILL_COLLECTION)
        }
      >
        <MdStarOutline />
      </IconButton>
    </Style>
  );
}

export default Top;
