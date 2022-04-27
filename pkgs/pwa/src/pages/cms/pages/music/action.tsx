import React from 'react';
import styled from 'styled-components';

import useHistory from '@/utils/use_history';
import IconButton, { Name } from '@/components/icon_button';
import Tooltip, { Placement } from '@/components/tooltip';
import { Query } from './constants';

const Style = styled.div`
  padding: 20px 0;
  width: 75px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const Action = () => {
  const history = useHistory();
  const openCreateDialog = () =>
    history.push({
      query: {
        [Query.CREATE_DIALOG_OPEN]: '1',
      },
    });
  const openOperateRecordDialog = () =>
    history.push({
      query: {
        [Query.OPERATE_RECORD_DIALOG_OPEN]: '1',
        [Query.OPERATE_RECORD_DIALOG_MUSIC_ID]: '',
      },
    });
  return (
    <Style>
      <Tooltip title="创建音乐" placement={Placement.RIGHT}>
        <IconButton name={Name.PLUS_OUTLINE} onClick={openCreateDialog} />
      </Tooltip>
      <Tooltip title="操作记录" placement={Placement.RIGHT}>
        <IconButton
          name={Name.HISTORY_OUTLINE}
          onClick={openOperateRecordDialog}
        />
      </Tooltip>
    </Style>
  );
};

export default Action;
