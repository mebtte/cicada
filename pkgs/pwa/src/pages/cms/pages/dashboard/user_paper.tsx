import React from 'react';

import { CMS_PATH } from '@/constants/route';
import useHistory from '@/utils/use_history';
import Tooltip, { Placement } from '@/components/tooltip';
import IconButton, { Name as IconButtonName } from '@/components/icon_button';
import { Name as IconName } from '@/components/icon';
import Paper from './paper';
import { Query } from '../user/constants';

const ACTION_SIZE = 24;
const style = {
  cursor: 'pointer',
};

const UserPaper = ({ total }: { total: number }) => {
  const history = useHistory();
  const onClick = () => history.push({ pathname: CMS_PATH.USER });
  const onCreateUser = (event: React.MouseEvent) => {
    event.stopPropagation();
    return history.push({
      pathname: CMS_PATH.USER,
      query: {
        [Query.CREATE_DIALOG_OPEN]: '1',
      },
    });
  };
  return (
    <Paper
      onClick={onClick}
      icon={IconName.ID_FILL}
      label="用户数"
      value={total.toString()}
      style={style}
    >
      <Tooltip title="创建用户" placement={Placement.BOTTOM}>
        <IconButton
          name={IconButtonName.PLUS_OUTLINE}
          size={ACTION_SIZE}
          onClick={onCreateUser}
        />
      </Tooltip>
    </Paper>
  );
};

export default UserPaper;
