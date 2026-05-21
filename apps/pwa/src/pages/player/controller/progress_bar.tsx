import { Slider } from '@/components';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import { CONTROLLER_PROGRESS_HEIGHT } from '../constants';
import useProgressSeek from '../use_progress_seek';

const StyledSlider = styled(Slider)`
  z-index: 1;
  flex: 0 0 ${CONTROLLER_PROGRESS_HEIGHT}px;
`;

function Progress({
  duration,
  bufferedPercent,
}: {
  duration: number;
  bufferedPercent: number;
}) {
  const currentMillisecond = useAudioCurrentMillisecond();
  const { displayPercent, onChange, onCommit } = useProgressSeek({
    duration,
    currentMillisecond,
  });

  return (
    <StyledSlider
      edge="rounded"
      value={displayPercent}
      onChange={onChange}
      onCommit={onCommit}
      secondValue={bufferedPercent}
      alwaysShowThumb
    />
  );
}

export default Progress;
