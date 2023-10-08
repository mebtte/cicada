import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import day from '#/utils/day';
import { CreateUser as CreateUserType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div`
  padding: 30px 0;

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
  createTimestamp,
}: {
  user: CreateUserType;
  createTimestamp: number;
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
      」于「{day(createTimestamp).format('YYYY-MM-DD')}
      」创建
    </Style>
  );
}

export default CreateUser;
