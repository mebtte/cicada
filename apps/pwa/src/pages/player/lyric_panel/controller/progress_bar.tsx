import styled from 'styled-components';
import { Slider } from '@/components';
import { CSSVariable } from '@/global_style';
import useAudioCurrentMillisecond from '../../use_audio_current_millisecond';
import { formatSecond } from '../../utils';
import { LYRIC_PANEL_PROGRESS_BOTTOM_PADDING } from '../constants';
import useProgressSeek from '../../use_progress_seek';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px ${LYRIC_PANEL_PROGRESS_BOTTOM_PADDING}px;

  > .slider {
    flex: 1;
    min-width: 0;
  }

  > .time {
    min-width: 42px;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }
`;

function Wrapper({
  duration,
  bufferedPercent,
}: {
  duration: number;
  bufferedPercent: number;
}) {
  const currentMillisecond = useAudioCurrentMillisecond();
  const {
    displayMillisecond,
    displayPercent,
    onChange: onTimeChange,
    onCommit: onTimeCommit,
  } = useProgressSeek({
    duration,
    currentMillisecond,
  });

  return (
    <Style>
      <div className="time">{formatSecond(displayMillisecond / 1000)}</div>
      <Slider
        value={displayPercent}
        onChange={onTimeChange}
        onCommit={onTimeCommit}
        className="slider"
        secondValue={bufferedPercent}
        alwaysShowThumb
      />
      <div className="time">{formatSecond(duration)}</div>
    </Style>
  );
}

export default Wrapper;
