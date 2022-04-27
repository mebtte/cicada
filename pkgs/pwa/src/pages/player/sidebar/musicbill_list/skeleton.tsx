import React, { useMemo } from 'react';
import styled from 'styled-components';

import scrollbarNever from '@/style/scrollbar_never';
import getRandomInteger from '@/utils/get_random_integer';
import Skeleton from '@/components/skeleton';
import {
  CONTAINETR_STYLE,
  NAME_STYLE,
  COVER_SIZE,
  MusicbillListContainer,
} from './constants';

const Style = styled(MusicbillListContainer)`
  overflow: auto;
  ${scrollbarNever}
`;
const Item = styled.div`
  ${CONTAINETR_STYLE}
  > .name {
    ${NAME_STYLE}
  }
`;

const SkeletonWrapper = ({ style }: { style: unknown }) => {
  const array = useMemo(
    () =>
      new Array(getRandomInteger(3, 10)).fill(0).map((_, index) => ({
        key: index,
        nameWidth: getRandomInteger(40, 100),
      })),
    [],
  );
  return (
    <Style style={style}>
      {array.map(({ key, nameWidth }) => (
        <Item key={key}>
          <Skeleton width={COVER_SIZE} height={COVER_SIZE} />
          <div className="name">
            <Skeleton width={nameWidth} />
          </div>
        </Item>
      ))}
    </Style>
  );
};

export default SkeletonWrapper;
