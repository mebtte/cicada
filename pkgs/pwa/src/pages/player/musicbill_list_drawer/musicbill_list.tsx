import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import { Musicbill as MusicbillType, Music as MusicType } from '../constants';
import Musicbill from './musicbill';
import CreateMusicbill from './create_musicbill';

const Style = styled.div<{ topBoxShadow: number }>`
  flex: 1;
  min-height: 0;

  padding: 0 20px;

  overflow: auto;
  ${scrollbarAsNeeded}

  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 10%)'
      : 'none'};
  `}
`;

const MusicbillList = ({
  musicbillList,
  music,
}: {
  musicbillList: MusicbillType[];
  music?: MusicType;
}) => {
  const [topBoxShadow, setTopBoxShadow] = useState(0);
  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop === 0 ? 0 : 1);
  };
  return (
    <Style topBoxShadow={topBoxShadow} onScroll={onScroll}>
      {musicbillList.map((musicbill) => (
        <Musicbill key={musicbill.id} musicbill={musicbill} music={music} />
      ))}
      <CreateMusicbill />
    </Style>
  );
};

export default MusicbillList;
