import { HtmlHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import { AVATAR_SIZE } from './constants';

const Style = styled.div`
  padding: 5px 0 5px 20px;

  display: flex;
  align-items: center;
  gap: 15px;

  > * {
    flex-shrink: 0;
  }

  > .avatar {
    width: ${AVATAR_SIZE}px;
  }

  > .nickname {
    width: 120px;
  }

  > .id {
    width: 80px;
  }

  > .email {
    width: 180px;
  }

  > .last-active-time {
    width: 100px;
  }

  > .join-time {
    width: 100px;
  }

  > .musicbill-max-amount {
    width: 80px;
  }

  > .remark {
    width: 150px;
  }
`;

function Row({
  id,
  avatar,
  nickname,
  email,
  lastActiveTime,
  joinTime,
  musicbillMaxAmount,
  remark,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'id'> & {
  id: ReactNode;
  avatar: ReactNode;
  nickname: ReactNode;
  email: ReactNode;
  lastActiveTime: ReactNode;
  joinTime: ReactNode;
  musicbillMaxAmount: ReactNode;
  remark: ReactNode;
}) {
  return (
    <Style {...props}>
      <div className="avatar">{avatar}</div>
      <div className="nickname">{nickname}</div>
      <div className="id">{id}</div>
      <div className="email">{email}</div>
      <div className="last-active-time">{lastActiveTime}</div>
      <div className="join-time">{joinTime}</div>
      <div className="musicbill-max-amount">{musicbillMaxAmount}</div>
      <div className="remark">{remark}</div>
    </Style>
  );
}

export default Row;
