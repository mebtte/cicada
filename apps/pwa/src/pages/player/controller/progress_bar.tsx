import Slider from '@/components/slider';
import { CSSProperties } from 'react';
import styled from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import { CSSVariable } from '@/global_style';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const style: CSSProperties = {
  zIndex: 1,
};
const SecondTrack = styled.div`
  ${absoluteFullSize}
  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_FIVE};
  transform-origin: left;
  transition: transform 0.3s;
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
    <Slider
      current={percent}
      onChange={onChange}
      style={style}
      secondTrack={
        <SecondTrack
          style={{
            transform: `scaleX(${bufferedPercent * 100}%)`,
          }}
        />
      }
    />
  );
}

export default Progress;
