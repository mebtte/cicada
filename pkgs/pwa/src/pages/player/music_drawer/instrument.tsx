import { memo } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  font-size: 12px;
  color: rgb(155 155 155);
`;

function Instrument() {
  return <Style>纯音乐, 无歌词</Style>;
}

export default memo(Instrument);
