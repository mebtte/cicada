import styled, { css } from 'styled-components';
import { type StopTimer as StopTimerType } from '../constants';
import { CSSProperties, useEffect, useState } from 'react';
import IconButton from '@/components/icon_button';
import { MdClose } from 'react-icons/md';
import { CSSVariable } from '@/global_style';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Style = styled.div<{ dragging: boolean; direction: 'left' | 'right' }>`
  display: flex;
  align-items: center;
  gap: 5px;

  padding: 2px;

  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_FIVE};
  user-select: none;

  > .time {
    margin-left: 8px;

    font-family: monospace;
    font-size: 12px;
  }

  ${({ dragging, direction }) => css`
    border-radius: ${dragging
      ? '4px'
      : direction === 'right'
      ? '4px 0 0 4px'
      : '0 4px 4px 0'};
  `}
`;
const timeToString = (endTimestamp: number) => {
  let seconds = Math.floor((endTimestamp - Date.now()) / 1000);
  seconds = Math.max(0, seconds);
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};
const closeIconStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function TimeString({ stopTimer }: { stopTimer: StopTimerType }) {
  const { endTimestamp } = stopTimer;
  const [timeString, setTimeString] = useState(() =>
    timeToString(endTimestamp),
  );

  useEffect(() => {
    const timer = globalThis.setInterval(
      () => setTimeString(timeToString(endTimestamp)),
      900,
    );
    return () => globalThis.clearInterval(timer);
  }, [endTimestamp]);

  return timeString;
}

function Content({
  dragging,
  direction,
  stopTimer,
}: {
  dragging: boolean;
  direction: 'left' | 'right';
  stopTimer: StopTimerType;
}) {
  const onClose = () =>
    dialog.confirm({
      content: t('remove_stop_timer_question'),
      onConfirm: () =>
        playerEventemitter.emit(PlayerEventType.REMOVE_STOP_TIMER, null),
    });
  return (
    <Style dragging={dragging} direction={direction}>
      <div className="time">
        <TimeString stopTimer={stopTimer} />
      </div>
      <IconButton size={24} style={closeIconStyle} onClick={onClose}>
        <MdClose />
      </IconButton>
    </Style>
  );
}

export default Content;
