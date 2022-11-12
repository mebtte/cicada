import styled from 'styled-components';
import { CSSVariable } from '#/global_style';
import { CreateUser as CreateUserType } from './constants';

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
  /**
   * @todo 跳转用户页面
   * @author mebtte<hi@mebtte.com>
   */
  return (
    <Style>
      「<span className="nickname">{user.nickname}</span>」于「{createTime}
      」创建
    </Style>
  );
}

export default CreateUser;
