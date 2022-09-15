import { memo, useCallback } from 'react';
import { Lrc, LrcLine } from 'react-lrc';
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

function LyricList({ lrc }: { lrc: string }) {
  const lineRenderer = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ line }: { line: LrcLine }) => <Line>{line.content}</Line>,
    [],
  );
  return (
    <Style>
      <Lrc lrc={lrc} lineRenderer={lineRenderer} />
    </Style>
  );
}

export default memo(LyricList);
