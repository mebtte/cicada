import { memo, useCallback, useMemo } from 'react';
import { MultipleLrc, MultipleLrcLine } from 'react-lrc';
import styled from 'styled-components';
import { Lyric } from './constants';

const Style = styled.div`
  overflow: hidden;
  transition: 1s;
`;
const Line = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: rgb(155 155 155);
`;

function LyricList({ lyrics }: { lyrics: Lyric[] }) {
  const lineRenderer = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ line }: { line: MultipleLrcLine }) => (
      <Line>
        {line.children.map((l, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index}>{l.content}</div>
        ))}
      </Line>
    ),
    [],
  );
  const lrcs = useMemo(() => lyrics.map((l) => l.content), [lyrics]);

  return (
    <Style>
      <MultipleLrc lrcs={lrcs} lineRenderer={lineRenderer} />
    </Style>
  );
}

export default memo(LyricList);
