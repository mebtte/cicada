import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';

const Style = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  transform: scale(0.9);

  > .duration {
    border-top: 1px solid ${CSSVariable.COLOR_BORDER};
  }
`;
const formatSecond = (s: number) => {
  const minute = Math.floor(s / 60);
  const second = Math.floor(s % 60);
  return `${minute < 10 ? '0' : ''}${minute}:${
    second < 10 ? '0' : ''
  }${second}`;
};

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
