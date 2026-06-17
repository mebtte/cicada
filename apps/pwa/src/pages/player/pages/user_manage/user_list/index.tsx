import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from '@react-spring/web';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import useQuery from '@/utils/use_query';
import { Query } from '@/constants';
import SizeObserver from '@/components/size_observer';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../../constants';
import { PAGE_HORIZONTAL_PADDING } from '../../page';
import useData from './use_data';
import User from './user';
import { TOOLBAR_HEIGHT } from '../constants';
import { GAP, ITEM_MIN_WIDTH } from './constants';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const UserListContainer = styled(Container)`
  overflow: auto;

  > .content {
    font-size: 0;
    padding: 0 calc(${PAGE_HORIZONTAL_PADDING} - ${GAP / 2}px);
  }

  &::after {
    content: '';
    display: block;
    height: calc(${TOOLBAR_HEIGHT}px + ${FLOATING_CONTROLLER_SCROLL_SPACE});
  }
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
        u.nickname.toLowerCase().includes(lowerCaseKeyword) ||
        u.username.toLowerCase().includes(lowerCaseKeyword) ||
        u.remark.toLowerCase().includes(lowerCaseKeyword),
    );

    return (
      <UserListContainer style={style}>
        <SizeObserver className="content">
          {({ width }) => {
            const itemWidth = `${100 / Math.floor(width / ITEM_MIN_WIDTH)}%`;
            return filteredUserList.map((user) => (
              <User key={user.id} user={user} width={itemWidth} />
            ));
          }}
        </SizeObserver>
      </UserListContainer>
    );
  });
}

export default UserList;
