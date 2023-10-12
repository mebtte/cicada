import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { HtmlHTMLAttributes } from 'react';
import { CreateUser as CreateUserType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  text-align: center;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .nickname {
    text-decoration: underline;
    cursor: pointer;
  }
`;

function CreateUser({
  user,
  createTime,
  ...props
}: {
  user: CreateUserType;
  createTime: string;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props}>
      「
      <span
        className="nickname"
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
            id: user.id,
          })
        }
      >
        {user.nickname}
      </span>
      」于「{createTime}
      」创建
    </Style>
  );
}

export default CreateUser;
