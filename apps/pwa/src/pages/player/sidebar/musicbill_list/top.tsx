import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd, MdSort, MdRefresh } from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import Tooltip from '#/components/tooltip';
import { useContext } from 'react';
import { RequestStatus } from '@/constants';
import e, { EventType } from '../../eventemitter';
import Context from '../../context';

const reloadMusicbillList = () => e.emit(EventType.RELOAD_MUSICBILL_LIST, null);
const openCreateMusicbillDialog = () =>
  e.emit(EventType.OPEN_CREATE_MUSICBILL_DIALOG, null);
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
      <Tooltip title="重新加载">
        <IconButton
          size={ComponentSize.SMALL}
          onClick={reloadMusicbillList}
          loading={getMusicbillListStatus === RequestStatus.LOADING}
        >
          <MdRefresh />
        </IconButton>
      </Tooltip>
      <Tooltip title="创建">
        <IconButton
          size={ComponentSize.SMALL}
          onClick={openCreateMusicbillDialog}
        >
          <MdAdd />
        </IconButton>
      </Tooltip>
      <Tooltip title="排序">
        <IconButton
          size={ComponentSize.SMALL}
          onClick={openMusicbillOrderDrawer}
        >
          <MdSort />
        </IconButton>
      </Tooltip>
    </Style>
  );
}

export default Top;
