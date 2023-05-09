import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import useQuery from '@/utils/use_query';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import { CSSVariable } from '@/global_style';
import useData from './use_data';
import User from './user';
import { HEADER_HEIGHT } from '../../../constants';
import { TOOLBAR_HEIGHT } from '../constants';
import Row from './row';

const Container = styled(animated.div)`
  ${absoluteFullSize}
  top: ${HEADER_HEIGHT}px;
  height: calc(100% - ${HEADER_HEIGHT}px);

  padding-bottom: ${TOOLBAR_HEIGHT}px;
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const UserListContainer = styled(Container)`
  overflow: auto;
  font-size: 0;
`;
const headStyle: CSSProperties = {
  position: 'sticky',
  top: 0,

  backdropFilter: 'blur(5px)',
};
const HeadText = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

function UserList() {
  const { keyword = '' } = useQuery<Query.KEYWORD>();
  const { data, reload } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, d) => {
    const { error, loading, userList } = d;

    if (error) {
      return (
        <StatusContainer style={style}>
          <ErrorCard errorMessage={error.message} retry={reload} />
        </StatusContainer>
      );
    }

    if (loading) {
      return (
        <StatusContainer style={style}>
          <Spinner />
        </StatusContainer>
      );
    }

    const lowerCaseKeyword = keyword.toLowerCase();
    const filteredUserList = userList.filter(
      (u) =>
        u.id.includes(lowerCaseKeyword) ||
        u.nickname.toLowerCase().includes(lowerCaseKeyword) ||
        u.email.toLowerCase().includes(lowerCaseKeyword) ||
        u.remark.toLowerCase().includes(lowerCaseKeyword),
    );

    return (
      <UserListContainer style={style}>
        <Row
          avatar={<HeadText>头像</HeadText>}
          nickname={<HeadText>昵称</HeadText>}
          id={<HeadText>ID</HeadText>}
          email={<HeadText>邮箱</HeadText>}
          lastActiveTime={<HeadText>上次活动时间</HeadText>}
          joinTime={<HeadText>加入时间</HeadText>}
          musicbillMaxAmount={<HeadText>乐单最大数量</HeadText>}
          remark={<HeadText>备注</HeadText>}
          createMusicMaxAmountPerDay={<HeadText>每天音乐创建最大数量</HeadText>}
          exportMusicbillMaxTimePerDay={
            <HeadText>每天乐单导出最大次数</HeadText>
          }
          more={<HeadText>操作</HeadText>}
          style={headStyle}
        />
        {filteredUserList.map((user) => (
          <User key={user.id} user={user} />
        ))}
      </UserListContainer>
    );
  });
}

export default UserList;
