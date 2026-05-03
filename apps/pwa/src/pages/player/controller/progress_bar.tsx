import { Slider } from '@/components';
import { CSSProperties } from 'react';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const style: CSSProperties = {
  zIndex: 1,
};

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
    <Slider
      edge="square"
      value={percent}
      onChange={onChange}
      style={style}
      secondValue={bufferedPercent}
    />
  );
}

export default Progress;
