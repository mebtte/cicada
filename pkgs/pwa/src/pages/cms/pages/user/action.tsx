import React from 'react';
import styled from 'styled-components';

import useHistory from '@/utils/use_history';
import Tooltip, { Placement } from '@/components/tooltip';
import IconButton, { Name } from '@/components/icon_button';
import { Query, User } from './constants';

const Style = styled.div`
  padding: 20px 0;
  width: 75px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const Action = ({ selectedUserList }: { selectedUserList: User[] }) => {
  const history = useHistory();
  const openCreateDialog = () =>
    history.push({
      query: {
        [Query.CREATE_DIALOG_OPEN]: '1',
      },
    });
  const openSelectedUserListDialog = () =>
    history.push({ query: { [Query.SELECTED_USER_LIST_DIALOG_OPEN]: '1' } });
  const openEmailNotificationDialog = () =>
    history.push({
      query: { [Query.SEND_EMAIL_NOTIFICATION_DIALOG_OPEN]: '1' },
    });
  const openEmailNotificationHistory = () =>
    history.push({
      query: {
        [Query.EMAIL_NOTIFICATION_HISTORY_DIALOG_OPEN]: '1',
        [Query.EMAIL_NOTIFICATION_HISTORY_TO_USRE_ID]: '',
      },
    });
  const openUserOpreateRecordDialog = () =>
    history.push({
      query: {
        [Query.OPERATE_RECORD_DIALOG_OPEN]: '1',
        [Query.OPERATE_RECORD_DIALOG_USER_ID]: '',
      },
    });

  return (
    <Style>
      <Tooltip title="已选中用户列表" placement={Placement.RIGHT}>
        <IconButton
          name={Name.CHECKBOX_FILL}
          onClick={openSelectedUserListDialog}
          disabled={!selectedUserList.length}
        />
      </Tooltip>
      <Tooltip title="创建用户" placement={Placement.RIGHT}>
        <IconButton name={Name.PLUS_OUTLINE} onClick={openCreateDialog} />
      </Tooltip>
      <Tooltip title="操作记录" placement={Placement.RIGHT}>
        <IconButton
          name={Name.HISTORY_OUTLINE}
          onClick={openUserOpreateRecordDialog}
        />
      </Tooltip>
      <Tooltip title="发送邮件通知" placement={Placement.RIGHT}>
        <IconButton
          name={Name.EMAIL_FILL}
          onClick={openEmailNotificationDialog}
        />
      </Tooltip>
      <Tooltip title="邮件通知记录" placement={Placement.RIGHT}>
        <IconButton
          name={Name.EMAIL_LIST_FILL}
          onClick={openEmailNotificationHistory}
        />
      </Tooltip>
    </Style>
  );
};
export default Action;
