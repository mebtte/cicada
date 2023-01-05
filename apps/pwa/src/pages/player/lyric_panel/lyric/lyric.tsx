import styled, { css } from 'styled-components';
import { MultipleLrc, MultipleLrcLine } from 'react-lrc';
import absoluteFullSize from '@/style/absolute_full_size';
import { CSSVariable } from '@/global_style';
import useAudioCurrentMillisecond from '../../use_audio_current_millisecond';

const StyledMultipleLrc = styled(MultipleLrc)`
  ${absoluteFullSize}
`;
const Line = styled.div<{ active?: boolean }>`
  margin: 20px;

  display: flex;
  justify-content: center;

  > .content {
    padding: 10px 20px;

    text-align: center;
    backdrop-filter: blur(10px);
    font-size: 16px;
    line-height: 1.5;
    font-weight: bold;

    &:empty {
      visibility: hidden;
    }
  }

  ${({ active }) => css`
    > .content {
      background-color: ${active
        ? 'rgb(255 255 255 / 0.8)'
        : 'rgb(255 255 255 / 0.4)'};
      color: ${active
        ? CSSVariable.COLOR_PRIMARY
        : CSSVariable.TEXT_COLOR_PRIMARY};
    }
  `}
`;
const lineRenderer = ({
  active,
  line,
}: {
  index: number;
  active: boolean;
  line: MultipleLrcLine;
}) => (
  <Line active={active}>
    <div className="content">
      {line.children.map((child) =>
        child.content ? (
          <div key={child.id} className="child">
            {child.content}
          </div>
        ) : null,
      )}
    </div>
  </Line>
);

function Lyric({ lrcs }: { lrcs: string[] }) {
  const currentMillisecond = useAudioCurrentMillisecond();
  return (
    <StyledMultipleLrc
      currentMillisecond={currentMillisecond}
      lrcs={lrcs}
      lineRenderer={lineRenderer}
      verticalSpace
    />
  );
}

export default Lyric;
