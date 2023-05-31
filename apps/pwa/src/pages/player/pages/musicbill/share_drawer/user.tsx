import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { MdPersonOutline, MdOutlineForwardToInbox } from 'react-icons/md';
import { MusicbillSharedUserStatus } from '#/constants';
import { User as UserType } from './constants';

const Style = styled.div`
  margin: 10px;

  display: flex;
  align-items: center;
  gap: 10px;

  > .nickname {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .status {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }
`;

function User({ user }: { user: UserType }) {
  return (
    <Style>
      <Cover size={24} src={user.avatar} shape={Shape.CIRCLE} />
      <div className="nickname">{user.nickname}</div>
      {user.status === MusicbillSharedUserStatus.OWNER ? (
        <MdPersonOutline className="status" title="所有者" />
      ) : null}
      {user.status === MusicbillSharedUserStatus.INVITED ? (
        <MdOutlineForwardToInbox className="status" title="已发送邀请" />
      ) : null}
    </Style>
  );
}

export default User;
