import React, { useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';

import Tooltip from '@/components/tooltip';
import useHistory from '@/utils/use_history';
import Checkbox from '@/components/checkbox';
import day from '@/utils/day';
import { SearchKey } from '@/server/cms_get_user_list';
import IconButton, { Name as IconButtonName } from '@/components/icon_button';
import Icon, { Name as IconName } from '@/components/icon';
import Empty from '@/components/empty';
import CircularLoader from '@/components/circular_loader';
import Table from '@/components/table';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Avatar from '@/components/avatar';
import { Query, User } from '../constants';
import eventemitter, { EventType } from '../eventemitter';
import CMSEventemitter, {
  EventType as CMSEventType,
} from '../../../eventemitter';

const Style = styled.div<{ isLoading: boolean }>`
  flex: 1;
  min-height: 0;
  position: relative;
  > .content {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: auto;
    ${scrollbarAsNeeded}
    > .table {
      width: 100%;
    }
  }
  > .loading {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ${({ isLoading }) => css`
    > .content {
      opacity: ${isLoading ? 0.5 : 1};
    }
  `}
`;
const emptyStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
};
const ActionBox = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;
const enableStyle = {
  color: 'var(--color-primary)',
};
const disableStyle = {
  color: 'rgb(220 0 78)',
};
const Small = styled.div`
  font-size: 12px;
`;
const ACTION_SIZE = 22;
const headers = [
  '选中',
  'ID',
  '邮箱',
  '昵称',
  '头像',
  '注册',
  'CMS',
  '账号可用',
  '备注',
  '操作',
];

const UserList = ({
  selectedUserList,
  userList,
  loading,
  page,
  searchKey,
  searchValue,
}: {
  selectedUserList: User[];
  userList: User[];
  loading: boolean;
  page: number;
  searchKey: SearchKey;
  searchValue: string;
}) => {
  const history = useHistory();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const selectedUserIdList = selectedUserList.map((u) => u.id);
  const rowRenderer = (u: User) => [
    <Checkbox
      checked={selectedUserIdList.includes(u.id)}
      onChange={() =>
        eventemitter.emit(EventType.TOGGLE_SELECT_USER, { user: u })
      }
    />,
    <Small>{u.id}</Small>,
    <Small>{u.email}</Small>,
    u.nickname,
    u.avatar ? <Avatar src={u.avatar} /> : '-',
    <Small>{day(u.join_time).format('YYYY-MM-DD HH:mm')}</Small>,
    <Icon
      name={u.cms ? IconName.CORRECT_OUTLINE : IconName.WRONG_OUTLINE}
      style={u.cms ? enableStyle : disableStyle}
    />,
    <Icon
      name={u.disabled ? IconName.WRONG_OUTLINE : IconName.CORRECT_OUTLINE}
      style={u.disabled ? disableStyle : enableStyle}
    />,
    <Small>{u.remark}</Small>,
    <ActionBox>
      <Tooltip title="编辑">
        <IconButton
          name={IconButtonName.EDIT_OUTLINE}
          size={ACTION_SIZE}
          onClick={() =>
            eventemitter.emit(EventType.OPEN_UPDATE_DIALOG, { user: u })
          }
        />
      </Tooltip>
      <Tooltip title="详情">
        <IconButton
          name={IconButtonName.VIEW_OUTLINE}
          size={ACTION_SIZE}
          onClick={() =>
            CMSEventemitter.emit(CMSEventType.VIEW_JSON, { json: u })
          }
        />
      </Tooltip>
      <Tooltip title="操作记录">
        <IconButton
          name={IconButtonName.HISTORY_OUTLINE}
          size={ACTION_SIZE}
          onClick={() =>
            history.push({
              query: {
                [Query.OPERATE_RECORD_DIALOG_OPEN]: '1',
                [Query.OPERATE_RECORD_DIALOG_USER_ID]: u.id,
              },
            })
          }
        />
      </Tooltip>
      <Tooltip title="邮件通知记录">
        <IconButton
          name={IconButtonName.EMAIL_LIST_FILL}
          size={ACTION_SIZE}
          onClick={() =>
            history.push({
              query: {
                [Query.EMAIL_NOTIFICATION_HISTORY_DIALOG_OPEN]: '1',
                [Query.EMAIL_NOTIFICATION_HISTORY_TO_USRE_ID]: u.id,
              },
            })
          }
        />
      </Tooltip>
    </ActionBox>,
  ];

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    contentRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [page, searchKey, searchValue]);

  return (
    <Style isLoading={loading}>
      {loading || userList.length ? (
        <div className="content" ref={contentRef}>
          <Table
            className="table"
            list={userList}
            headers={headers}
            rowRenderer={rowRenderer}
            stickyHeader
          />
        </div>
      ) : (
        <Empty style={emptyStyle} />
      )}
      {loading && (
        <div className="loading">
          <CircularLoader />
        </div>
      )}
    </Style>
  );
};

export default UserList;
