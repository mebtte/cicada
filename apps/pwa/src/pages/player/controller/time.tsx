import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import { formatSecond } from '../utils';

const Style = styled.div`
  padding: 4px 7px;

  font-family: 'Nunito', monospace;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 800;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  user-select: none;

  background: rgb(248 248 248);
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  box-shadow: 0 3px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};

  > .duration {
    border-top: 2px solid ${CSSVariable.COLOR_BORDER};
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
