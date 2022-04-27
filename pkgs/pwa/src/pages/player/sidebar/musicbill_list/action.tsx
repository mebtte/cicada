import React from 'react';
import styled from 'styled-components';

import { RequestStatus } from '@/constants';
import IconButton, { Name as IconButtonName } from '@/components/icon_button';
import Tooltip from '@/components/tooltip';
import eventemitter, { EventType } from '../../eventemitter';
import { Musicbill } from '../../constants';

const ACTION_SIZE = 20;
const Style = styled.div`
  padding: 0 20px 5px 20px;
  display: flex;
  align-items: center;
  gap: 2px;
  > .label {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: rgb(150 150 150);
  }
  > .icon {
    cursor: pointer;
    margin-left: 10px;
  }
`;

const onCreateMusicbill = () =>
  eventemitter.emit(EventType.OPEN_CREATE_MUSICBILL_DIALOG);
const onOrderMusicbillList = () =>
  eventemitter.emit(EventType.OPEN_MUSICBILL_ORDER_DRAWER);
const onReloadMusicbillList = () =>
  eventemitter.emit(EventType.RELOAD_MUSICBILL_LIST);

const Action = ({
  status,
  musicbillList,
}: {
  status: RequestStatus;
  musicbillList: Musicbill[];
}) => (
  <Style>
    <div className="label">我的歌单</div>
    <Tooltip title="创建歌单">
      <IconButton
        name={IconButtonName.PLUS_OUTLINE}
        size={ACTION_SIZE}
        onClick={onCreateMusicbill}
        disabled={status !== RequestStatus.SUCCESS}
      />
    </Tooltip>
    <Tooltip title="排序歌单">
      <IconButton
        name={IconButtonName.EXCHANGE_OUTLINE}
        size={ACTION_SIZE}
        onClick={onOrderMusicbillList}
        disabled={status !== RequestStatus.SUCCESS || !musicbillList.length}
      />
    </Tooltip>
    <Tooltip title="重新获取歌单">
      <IconButton
        name={IconButtonName.REFRESH_OUTLINE}
        size={ACTION_SIZE}
        loading={status === RequestStatus.LOADING}
        onClick={onReloadMusicbillList}
      />
    </Tooltip>
  </Style>
);

export default Action;
