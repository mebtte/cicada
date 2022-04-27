import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import Empty from '@/components/empty';
import { PLAYER_PATH } from '@/constants/route';
import useHistory from '@/utils/use_history';
import Cover from './cover';
import { Musicbill } from '../constants';
import Container from './container';

const StyledContainer = styled(Container)<{
  topBoxShadow: boolean;
}>`
  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 15%)'
      : 'none'};
  `}
`;
const EmptyBox = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MusicbillList = ({
  musicbillList,
  onCloseDrawer,
}: {
  musicbillList: Musicbill[];
  onCloseDrawer: () => void;
}) => {
  const history = useHistory();

  const [topBoxShadow, setTopBoxShadow] = useState(false);
  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop !== 0);
  };

  if (!musicbillList.length) {
    return (
      <EmptyBox>
        <Empty description="暂无公开歌单" />
      </EmptyBox>
    );
  }
  return (
    <StyledContainer onScroll={onScroll} topBoxShadow={topBoxShadow}>
      {musicbillList.map((mb) => {
        const onView = () => {
          history.push({
            pathname: PLAYER_PATH.PUBLIC_MUSICBILL,
            query: { id: mb.id },
          });
          return onCloseDrawer();
        };
        return (
          <div className="musicbill" key={mb.id}>
            <Cover src={mb.cover} onClick={onView} />
            <div className="name" onClick={onView}>
              {mb.name}
            </div>
          </div>
        );
      })}
    </StyledContainer>
  );
};

export default MusicbillList;
