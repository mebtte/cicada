import React from 'react';

import Empty from '@/components/empty';
import Checkbox from '@/components/checkbox';
import Table from '@/components/table';
import useHistory from '@/utils/use_history';
import Dialog, { Title, Content } from '@/components/dialog';
import { Query, User } from './constants';
import eventemitter, { EventType } from './eventemitter';

const bodyProps = {
  style: { width: 650 },
};
const tableStyle = {
  width: '100%',
};
const headers = ['选择', 'ID', '邮箱', '昵称', '备注'];
const rowRenderer = (user: User) => [
  <Checkbox
    checked
    onChange={() => eventemitter.emit(EventType.UNSELECT_USER, { user })}
  />,
  user.id,
  user.email,
  user.nickname,
  user.remark,
];

const SelectedUserListDialog = ({
  open,
  selectedUserList,
}: {
  open: boolean;
  selectedUserList: User[];
}) => {
  const history = useHistory();
  const onClose = () =>
    history.push({ query: { [Query.SELECTED_USER_LIST_DIALOG_OPEN]: '' } });
  return (
    <Dialog open={open} onClose={onClose} bodyProps={bodyProps}>
      <Title>已选中 {selectedUserList.length} 个用户</Title>
      <Content>
        {selectedUserList.length ? (
          <Table
            list={selectedUserList}
            headers={headers}
            rowRenderer={rowRenderer}
            style={tableStyle}
          />
        ) : (
          <Empty description="未选中任何用户" />
        )}
      </Content>
    </Dialog>
  );
};

export default SelectedUserListDialog;
