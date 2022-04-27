import React from 'react';
import styled from 'styled-components';

import IconButton, { Name } from '@/components/icon_button';
import day from '@/utils/day';
import ellipsis from '@/style/ellipsis';
import Table from '@/components/table';
import { EmailNotification } from './constants';
import CMSEventemitter, {
  EventType as CMSEventType,
} from '../../../eventemitter';

const headers = [
  '目标用户 ID',
  '发送用户',
  '标题',
  '创建时间',
  '发送时间',
  '尝试发送次数',
  '详情',
];
const Ellipsis = styled.div`
  max-width: 150px;
  ${ellipsis}
`;
const Small = styled.div`
  font-size: 12px;
`;

const EmailNotificationList = ({
  emailNotificationList,
}: {
  emailNotificationList: EmailNotification[];
}) => {
  const rowRenderer = (emailNotification: EmailNotification) => [
    emailNotification.to_user_id,
    <span title={`ID:${emailNotification.send_user.id}`}>
      {emailNotification.send_user.nickname}
    </span>,
    <Ellipsis>{emailNotification.title}</Ellipsis>,
    <Small>
      {day(emailNotification.create_time).format('YYYY-MM-DD HH:mm')}
    </Small>,
    <Small>
      {emailNotification.send_time
        ? day(emailNotification.send_time).format('YYYY-MM-DD HH:mm')
        : '暂未发送'}
    </Small>,
    emailNotification.send_attempt_times,
    <IconButton
      name={Name.VIEW_OUTLINE}
      size={22}
      onClick={() =>
        CMSEventemitter.emit(CMSEventType.VIEW_JSON, {
          json: emailNotification,
        })
      }
    />,
  ];
  return (
    <Table
      list={emailNotificationList}
      headers={headers}
      rowRenderer={rowRenderer}
      stickyHeader
    />
  );
};

export default EmailNotificationList;
