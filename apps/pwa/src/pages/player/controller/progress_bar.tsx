import { Slider } from '@/components';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const StyledSlider = styled(Slider)`
  z-index: 1;
  flex: 0 0 26px;
`;

function Progress({
  duration,
  bufferedPercent,
}: {
  duration: number;
  bufferedPercent: number;
}) {
  const onChange = (p: number) =>
    playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
      second: duration * p,
    });

  const currentMillisecond = useAudioCurrentMillisecond();
  const percent = duration ? currentMillisecond / 1000 / duration : 0;

  return (
    <StyledSlider
      edge="rounded"
      value={percent}
      onChange={onChange}
      secondValue={bufferedPercent}
      alwaysShowThumb
    />
  );
}

export default Progress;
