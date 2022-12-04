import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CreateUser as CreateUserType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  padding: 30px 0;

  text-align: center;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .nickname {
    text-decoration: underline;
    cursor: pointer;
  }
`;

function CreateUser({
  user,
  createTime,
}: {
  user: CreateUserType;
  createTime: string;
}) {
  return (
    <Style>
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
