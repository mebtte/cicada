import React from 'react';
import styled from 'styled-components';

import { SearchKey, SEARCH_KEYS } from '@/server/cms_get_user_list';
import useQuery from '@/utils/use_query';
import { cmsPage } from '../../style';
import UpdateDialog from './update_dialog';
import UserList from './user_list';
import Action from './action';
import { Query } from './constants';
import CreateDialog from './create_dialog';
import SendEmailNotificationDialog from './send_email_notification_dialog';
import useSelectedUserList from './use_selected_user_list';
import SelectedUserListDialog from './selected_user_list_dialog';
import EmailNotificationHistoryDialog from './email_notification_history_dialog';
import OpreateRecordDialog from './operate_record_dialog';

const Style = styled.div`
  ${cmsPage};
  display: flex;
`;

const User = () => {
  const query = useQuery();
  let searchKey = query[Query.SEARCH_KEY] as SearchKey;
  if (!SEARCH_KEYS.includes(searchKey)) {
    searchKey = SearchKey.COMPOSITE;
  }
  const searchValue = query[Query.SEARCH_VALUE] || '';
  const pageString = query[Query.PAGE];
  const page = pageString ? +pageString : 1 || 1;
  const createDialogOpen = !!query[Query.CREATE_DIALOG_OPEN];
  const selectedUserListDialogOpen =
    !!query[Query.SELECTED_USER_LIST_DIALOG_OPEN];
  const sendEmailNotificationDialog =
    !!query[Query.SEND_EMAIL_NOTIFICATION_DIALOG_OPEN];

  const emailNotificationHistoryDialog =
    !!query[Query.EMAIL_NOTIFICATION_HISTORY_DIALOG_OPEN];
  const emailNotificationHistoryToUserId =
    query[Query.EMAIL_NOTIFICATION_HISTORY_TO_USRE_ID];

  const operateRecordDialogOpen = !!query[Query.OPERATE_RECORD_DIALOG_OPEN];
  const operateRecordDialogUserId = query[Query.OPERATE_RECORD_DIALOG_USER_ID];

  const selectedUserList = useSelectedUserList();

  return (
    <Style>
      <Action selectedUserList={selectedUserList} />
      <UserList
        selectedUserList={selectedUserList}
        searchKey={searchKey}
        searchValue={searchValue}
        page={page}
      />

      <CreateDialog open={createDialogOpen} />
      <UpdateDialog />
      <SendEmailNotificationDialog
        open={sendEmailNotificationDialog}
        selectedUserList={selectedUserList}
      />
      <EmailNotificationHistoryDialog
        open={emailNotificationHistoryDialog}
        toUserId={emailNotificationHistoryToUserId}
      />
      <SelectedUserListDialog
        open={selectedUserListDialogOpen}
        selectedUserList={selectedUserList}
      />
      <OpreateRecordDialog
        open={operateRecordDialogOpen}
        userId={operateRecordDialogUserId}
      />
    </Style>
  );
};

export default User;
