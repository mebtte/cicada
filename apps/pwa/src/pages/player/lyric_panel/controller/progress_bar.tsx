import styled from 'styled-components';
import Slider from '@/components/slider';
import { CSSVariable } from '@/global_style';
import absoluteFullSize from '@/style/absolute_full_size';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import useAudioCurrentMillisecond from '../../use_audio_current_millisecond';
import { formatSecond } from '../../utils';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;

  > .slider {
    flex: 1;
    min-width: 0;
  }

  > .time {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-family: monospace;
    transform: scale(0.9);
  }
`;
const SecondTrack = styled.div`
  ${absoluteFullSize}
  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_FIVE};
  transform-origin: left;
  transition: transform 0.3s;
`;

function Wrapper({
  duration,
  bufferedPercent,
}: {
  duration: number;
  bufferedPercent: number;
}) {
  const onTimeChange = (p: number) =>
    playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
      second: duration * p,
    });

  const currentMillisecond = useAudioCurrentMillisecond();
  const percent = duration ? currentMillisecond / 1000 / duration : 0;
  return (
    <Style>
      <div className="time">{formatSecond(currentMillisecond / 1000)}</div>
      <Slider
        current={percent}
        onChange={onTimeChange}
        className="slider"
        secondTrack={
          <SecondTrack
            style={{
              transform: `scaleX(${bufferedPercent * 100}%)`,
            }}
          />
        }
      />
      <div className="time">{formatSecond(duration)}</div>
    </Style>
  );
}

export default Wrapper;
