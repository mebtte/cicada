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
`;

const Action = () => {
  const history = useHistory();
  const openOperateRecordDialog = () =>
    history.push({
      query: {
        [Query.OPERATE_RECORD_DIALOG_OPEN]: '1',
        [Query.OPERATE_RECORD_DIALOG_KEY]: '',
      },
    });
  return (
    <Style>
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
