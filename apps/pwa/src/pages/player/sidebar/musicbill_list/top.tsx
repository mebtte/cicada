import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd, MdSort, MdRefresh } from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import { useContext } from 'react';
import { RequestStatus } from '@/constants';
import e, { EventType } from '../../eventemitter';
import Context from '../../context';
import { openCreateMusicbillDialog } from './utils';

const reloadMusicbillList = () => e.emit(EventType.RELOAD_MUSICBILL_LIST, null);
const openMusicbillOrderDrawer = () =>
  e.emit(EventType.OPEN_MUSICBILL_ORDER_DRAWER, null);
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
  const { getMusicbillListStatus } = useContext(Context);
  return (
    <Style>
      <div className="label">我的乐单</div>
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
      <IconButton size={ComponentSize.SMALL} onClick={openMusicbillOrderDrawer}>
        <MdSort />
      </IconButton>
    </Style>
  );
}

export default Top;
