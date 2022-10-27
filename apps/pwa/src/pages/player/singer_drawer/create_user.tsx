import styled from 'styled-components';
import { CSSVariable } from '#/global_style';
import { CreataUser } from './constants';

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
  user: CreataUser;
  createTime: string;
}) {
  /**
   * @todo 跳转用户页面
   * @author mebtte<hi@mebtte.com>
   */
  return (
    <Style>
      由「<span className="nickname">{user.nickname}</span>」于「{createTime}
      」创建
    </Style>
  );
}

export default CreateUser;
