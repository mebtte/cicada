import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import { formatSecond } from '../utils';

const Style = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  transform: scale(0.9);
  user-select: none;

  > .duration {
    border-top: 1px solid ${CSSVariable.COLOR_BORDER};
  }
`;

function Time({ duration }: { duration: number }) {
  const currentMillisecond = useAudioCurrentMillisecond();
  return (
    <Style>
      <div>{formatSecond(currentMillisecond / 1000)}</div>
      <div className="duration">{formatSecond(duration)}</div>
    </Style>
  );
}

export default Time;
