import { useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import {
  MultipleLrc,
  MultipleLrcLine,
  useRecoverAutoScrollImmediately,
} from 'react-lrc';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import eventemitter, { EventType } from './eventemitter';
import { Lyric } from './constants';

const StyledLrc = styled(MultipleLrc)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
const LyricLine = styled.div<{ active: boolean }>`
  text-align: center;
  padding: 5px 0;
  > .content {
    max-width: 80%;
    line-height: 1.5;
    display: inline-block;
    border-radius: 5px;
    padding: 7px 15px 5px 15px;
    font-size: 16px;
    text-align: center;
    transition: 300ms;
  }
  ${({ active }) => css`
    > .content {
      color: ${active ? 'var(--color-primary)' : 'var(--text-color-primary)'};
      background: rgb(255 255 255 / ${active ? 1 : 0.7});
    }
  `}
`;
const lrcLineRenderer = ({
  active,
  line,
}: {
  active: boolean;
  line: MultipleLrcLine;
}) => (
  <LyricLine active={active}>
    {line.children.map((child, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <div className="content" key={index}>
        {child.content}
      </div>
    ))}
  </LyricLine>
);

function LrcDisplay({ lyrics }: { lyrics: Lyric[] }) {
  const currentMillisecond = useAudioCurrentMillisecond();
  const { signal, recoverAutoScrollImmediately } =
    useRecoverAutoScrollImmediately();

  useEffect(() => {
    const unlistenScrollToCurrentLine = eventemitter.listen(
      EventType.SCROLL_TO_CURRENT_LINE,
      recoverAutoScrollImmediately,
    );
    return unlistenScrollToCurrentLine;
  }, [recoverAutoScrollImmediately]);

  const lrcs = useMemo(() => lyrics.map((l) => l.content), [lyrics]);
  return (
    <StyledLrc
      lrcs={lrcs}
      lineRenderer={lrcLineRenderer}
      currentMillisecond={currentMillisecond}
      verticalSpace
      recoverAutoScrollSingal={signal}
    />
  );
}

export default LrcDisplay;
