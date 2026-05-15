import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import { formatSecond } from '../utils';

const Style = styled.div`
  min-width: 42px;
  height: 34px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;

  font-family: 'Nunito', monospace;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 800;
  line-height: 1;
  text-align: center;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  user-select: none;
  transform: translateY(1.5px);
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
