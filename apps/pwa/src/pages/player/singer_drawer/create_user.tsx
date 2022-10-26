import styled from 'styled-components';
import Cover from '#/components/cover';
import { flexCenter } from '#/style/flexbox';
import { CSSVariable } from '#/global_style';
import { CreataUser } from './constants';

const Style = styled.div`
  ${flexCenter}

  padding: 50px 0;

  > .text {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
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
      <Cover size={18} src={user.avatar} alt="avatar" />
      <div className="text">
        「{user.nickname}」创建于「{createTime}」
      </div>
    </Style>
  );
}

export default CreateUser;
