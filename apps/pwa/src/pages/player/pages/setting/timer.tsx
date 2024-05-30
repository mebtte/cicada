import Item from './item';
import { itemStyle } from './constants';
import { t } from '@/i18n';
import Input from '@/components/input';
import styled from 'styled-components';
import { useState } from 'react';
import Button, { Variant } from '@/components/button';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;

  > .input {
    width: 100px;
  }
`;
const isValidMinute = (minutes: number) => minutes > 0;

function Timer() {
  const [value, setValue] = useState('');
  const minutes = Number(value);

  const isValid = isValidMinute(minutes);
  return (
    <Item label={`${t('stop_timer')}(${t('minute')})`} style={itemStyle}>
      <Style>
        <Input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
        />
        <Button variant={Variant.PRIMARY} disabled={!isValid}>
          开始
        </Button>
      </Style>
    </Item>
  );
}

export default Timer;
