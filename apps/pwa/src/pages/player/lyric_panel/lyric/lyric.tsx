import styled, { css } from 'styled-components';
import { MultipleLrc, MultipleLrcLine } from 'react-lrc';
import absoluteFullSize from '@/style/absolute_full_size';
import { CSSVariable } from '@/global_style';
import useAudioCurrentMillisecond from '../../use_audio_current_millisecond';
import autoScrollbar from '@/style/auto_scrollbar';

const StyledMultipleLrc = styled(MultipleLrc)`
  ${absoluteFullSize}
  ${autoScrollbar}

  --lyric-fade-size: 44px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--lyric-fade-size),
    #000 calc(100% - var(--lyric-fade-size)),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--lyric-fade-size),
    #000 calc(100% - var(--lyric-fade-size)),
    transparent 100%
  );
`;
const Line = styled.div<{ active?: boolean }>`
  margin: 20px;

  display: flex;
  justify-content: center;

  > .content {
    padding: 10px 20px;

    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
    text-align: center;
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 18px;
    line-height: 1.5;
    font-weight: 900;
    letter-spacing: 0;

    &:empty {
      visibility: hidden;
    }

    .child {
      display: block;
    }

    .text {
      display: inline-grid;
    }

    .text > span {
      grid-area: 1 / 1;
    }

    .outline {
      color: transparent;
      pointer-events: none;
      -webkit-text-stroke: 3px rgb(255 255 255 / 0.96);
    }

    .value {
      position: relative;
    }
  }

  ${({ active }) => css`
    > .content {
      background-color: transparent;
      color: ${active
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.TEXT_COLOR_PRIMARY};

      .outline {
        -webkit-text-stroke: ${active
          ? '4px rgb(255 255 255 / 0.98)'
          : '3px rgb(255 255 255 / 0.96)'};
      }
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
            <span className="text">
              <span className="outline" aria-hidden>
                {child.content}
              </span>
              <span className="value">{child.content}</span>
            </span>
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
