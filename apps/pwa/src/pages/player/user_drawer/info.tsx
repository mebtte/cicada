import styled from 'styled-components';
import Cover from '@/components/cover';
import day from '#/utils/day';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { UserDetail } from './constants';

const Style = styled.div`
  position: relative;

  font-size: 0;

  > .info {
    position: absolute;
    bottom: 0;
    left: 0;
    max-width: 90%;

    padding: 10px 20px;
    background-color: rgb(255 255 255 / 0.75);

    > .nickname {
      font-size: 24px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      ${ellipsis}
    }

    > .username {
      margin: 5px 0;

      font-size: 16px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }

    > .join-time {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }
`;

function Info({ user }: { user: UserDetail }) {
  return (
    <Style>
      <Cover src={user.avatar} size="100%" />
      <div className="info">
        <div className="nickname">{user.nickname}</div>
        <div className="username">@{user.username}</div>
        <div className="join-time">
          {day(user.joinTimestamp).format('YYYY-MM-DD')} 加入
        </div>
      </div>
    </Style>
  );
}

export default Info;
