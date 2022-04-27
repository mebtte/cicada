import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import CircularLoader from '@/components/circular_loader';
import Pagination from '@/components/pagination';
import ErrorCard from '@/components/error_card';
import Empty from '@/components/empty';
import Dialog, { Title, Content } from '@/components/dialog';
import useHistory from '@/utils/use_history';
import { Query } from '../constants';
import useEmailNotificationList from './use_email_notification_list';
import { PAGE_SIZE } from './constants';
import EmailNotificationList from './email_notification_list';

const bodyProps = {
  style: {
    width: 750,
  },
};
const cardStyle = {
  padding: '50px 0',
};
const TableBox = styled.div<{ isLoading: boolean }>`
  position: relative;
  min-height: 150px;
  margin-bottom: 10px;
  table {
    width: 100%;
  }
  > .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  ${({ isLoading }) => css`
    table {
      opacity: ${isLoading ? '0.5' : '1'};
    }
  `}
`;

const EmailNotificationHistoryDialog = ({
  open,
  toUserId,
}: {
  open: boolean;
  toUserId: string;
}) => {
  const history = useHistory();
  const onClose = () =>
    history.push({
      query: {
        [Query.EMAIL_NOTIFICATION_HISTORY_DIALOG_OPEN]: '',
      },
    });

  const {
    error,
    retry,
    loading,
    page,
    onPageChange,
    total,
    emailNotificationList,
  } = useEmailNotificationList({ open, toUserId });
  let content: ReactNode;
  if (error) {
    content = (
      <ErrorCard errorMessage={error.message} retry={retry} style={cardStyle} />
    );
  } else if (!loading && !emailNotificationList.length) {
    content = <Empty description="暂无邮件通知记录" style={cardStyle} />;
  } else {
    content = (
      <>
        <TableBox isLoading={loading}>
          <EmailNotificationList
            emailNotificationList={emailNotificationList}
          />
          {loading ? <CircularLoader className="loader" /> : null}
        </TableBox>
        <Pagination
          currentPage={page}
          pageCount={Math.ceil(total / PAGE_SIZE)}
          onPageChange={onPageChange}
        />
      </>
    );
  }
  return (
    <Dialog open={open} onClose={onClose} bodyProps={bodyProps}>
      <Title>邮件通知记录</Title>
      <Content>{content}</Content>
    </Dialog>
  );
};

export default EmailNotificationHistoryDialog;
