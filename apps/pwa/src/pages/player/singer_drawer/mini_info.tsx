import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import { useEffect, useState } from 'react';
import ellipsis from '@/style/ellipsis';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { MINI_INFO_HEIGHT, Singer } from './constants';

const Style = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${MINI_INFO_HEIGHT}px;

  background-color: #fff;

  display: flex;
  align-items: center;
  gap: 10px;

  > .name {
    flex: 1;
    min-width: 0;

    ${ellipsis}
    font-size: 18px;
    font-weight: bold;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }
`;

function MiniInfo({ singer }: { singer: Singer }) {
  const [paddingRight, setPaddingRight] = useState(0);
  const { right } = useTitlebarArea();

  useEffect(() => {
    setPaddingRight(right ? window.innerWidth - right : 0);
  }, [right]);

  return (
    <Style
      style={{
        padding: `0 ${paddingRight + 20}px 0 20px`,
      }}
    >
      <Cover src={singer.avatar} alt="singer avatar" />
      <div className="name">{singer.name}</div>
    </Style>
  );
}

export default MiniInfo;
