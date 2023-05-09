import { HtmlHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import { AVATAR_SIZE } from './constants';

const Style = styled.div`
  padding: 5px 20px;

  display: inline-flex;
  align-items: center;
  gap: 15px;

  user-select: none;

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

  > .create-music-max-amount-per-day {
    width: 130px;
  }

  > .export-musicbill-max-time-per-day {
    width: 130px;
  }

  > .remark {
    width: 150px;
  }

  > .more {
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
  createMusicMaxAmountPerDay,
  exportMusicbillMaxTimePerDay,
  remark,
  more,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'id'> & {
  id: ReactNode;
  avatar: ReactNode;
  nickname: ReactNode;
  email: ReactNode;
  lastActiveTime: ReactNode;
  joinTime: ReactNode;
  musicbillMaxAmount: ReactNode;
  createMusicMaxAmountPerDay: ReactNode;
  exportMusicbillMaxTimePerDay: ReactNode;
  remark: ReactNode;
  more: ReactNode;
}) {
  return (
    <Style {...props}>
      <div className="id">{id}</div>
      <div className="avatar">{avatar}</div>
      <div className="nickname">{nickname}</div>
      <div className="last-active-time">{lastActiveTime}</div>
      <div className="email">{email}</div>
      <div className="join-time">{joinTime}</div>
      <div className="musicbill-max-amount">{musicbillMaxAmount}</div>
      <div className="create-music-max-amount-per-day">
        {createMusicMaxAmountPerDay}
      </div>
      <div className="export-musicbill-max-time-per-day">
        {exportMusicbillMaxTimePerDay}
      </div>
      <div className="remark">{remark}</div>
      <div className="more">{more}</div>
    </Style>
  );
}

export default Row;
