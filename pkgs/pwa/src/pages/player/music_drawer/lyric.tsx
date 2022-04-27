import React from 'react';
import { Lrc, LyricLine } from 'react-lrc';
import styled from 'styled-components';

const Style = styled.div`
  overflow: hidden;
  transition: 1s;
`;
const Line = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: rgb(155 155 155);
`;

const LyricList = ({ lrc }: { lrc: string }) => (
  <Style>
    <Lrc
      lrc={lrc}
      lineRenderer={({ line }: { line: LyricLine }) => (
        <Line>{line.content}</Line>
      )}
      autoScroll={false}
    />
  </Style>
);

export default React.memo(LyricList);
