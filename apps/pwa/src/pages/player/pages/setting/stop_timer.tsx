import Item from './item';
import { itemStyle } from './constants';
import { t } from '@/i18n';
import Input from '@/components/input';
import styled from 'styled-components';
import { useContext, useState } from 'react';
import Button, { Variant } from '@/components/button';
import Context from '../../context';
import notice from '@/utils/notice';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;

  > .input {
    width: 100px;
  }
`;
const isValidMinute = (minutes: number) => minutes > 0;

function StopTimer() {
  const { stopTimer } = useContext(Context);
  const [value, setValue] = useState('');
  const minutes = Number(value);

  const onTimerStart = () => {
    if (stopTimer) {
      return notice.error(t('stop_timer_exist_warning'));
    }
    playerEventemitter.emit(PlayerEventType.ADD_STOP_TIMER, {
      endTimestamp: Date.now() + minutes * 60 * 1000,
    });
    return setValue('');
  };

  const isValid = isValidMinute(minutes);
  return (
    <Item label={`${t('stop_timer')}(${t('minute')})`} style={itemStyle}>
      <Style>
        <Input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
          min={1}
        />
        <Button
          variant={Variant.PRIMARY}
          disabled={!isValid}
          onClick={onTimerStart}
        >
          开始
        </Button>
      </Style>
    </Item>
  );
}

export default StopTimer;
