import styled from 'styled-components';
import Slider from '@/components/slider';
import { CSSVariable } from '@/global_style';
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
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-family: monospace;
    transform: scale(0.9);
  }
`;

function Wrapper({ duration }: { duration: number }) {
  const onTimeChange = (p: number) =>
    playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
      second: duration * p,
    });

  const currentMillisecond = useAudioCurrentMillisecond();
  const percent = duration ? currentMillisecond / 1000 / duration : 0;
  return (
    <Style>
      <div className="time">{formatSecond(currentMillisecond / 1000)}</div>
      <Slider current={percent} onChange={onTimeChange} className="slider" />
      <div className="time">{formatSecond(duration)}</div>
    </Style>
  );
}

export default Wrapper;
