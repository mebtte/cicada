import Slider from '@/components/slider';
import { CSSProperties } from 'react';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const style: CSSProperties = {
  zIndex: 1,
};

function Progress({ duration }: { duration: number }) {
  const onChange = (p: number) =>
    playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
      second: duration * p,
    });

  const currentMillisecond = useAudioCurrentMillisecond();
  const percent = duration ? currentMillisecond / 1000 / duration : 0;

  return <Slider current={percent} onChange={onChange} style={style} />;
}

export default Progress;
